import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db import get_db
from app.models.models import Alert, User, Patient
from app.schemas.schemas import AlertActionRequest, AlertAssignRequest, AlertOut
from app.core.deps import get_current_user, require_roles, log_audit_event

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("", response_model=List[AlertOut])
def list_alerts(
    risk_level: Optional[str] = Query(None, description="Filter by risk level: low, medium, high"),
    status: Optional[str] = Query(None, description="Filter by status: pending, acknowledged, resolved"),
    search: Optional[str] = Query(None, description="Search by patient name or MRN"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Alert).join(Patient).filter(
        Patient.hospital_id == current_user.hospital_id
    )

    if risk_level and risk_level != "all":
        query = query.filter(Alert.risk_level == risk_level)

    if status and status != "all":
        query = query.filter(Alert.status == status)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (Patient.full_name.ilike(search_pattern)) |
            (Patient.mrn.ilike(search_pattern))
        )

    alerts = query.order_by(
        desc(Alert.risk_level == "high"),
        desc(Alert.status == "pending"),
        desc(Alert.created_at)
    ).all()

    results = []
    for a in alerts:
        try:
            flags = json.loads(a.flags) if a.flags else []
        except Exception:
            flags = []

        patient = a.patient
        reviewer = a.reviewer

        results.append(AlertOut(
            id=a.id,
            patient_id=a.patient_id,
            patient_name=patient.full_name if patient else "Unknown",
            patient_phone=patient.phone if patient else "",
            checkin_id=a.checkin_id,
            care_plan_id=a.care_plan_id,
            risk_level=a.risk_level,
            summary=a.summary,
            flags=flags,
            status=a.status,
            acknowledged_by=a.acknowledged_by,
            acknowledged_by_name=reviewer.full_name if reviewer else None,
            acknowledged_at=a.acknowledged_at,
            action_taken=a.action_taken,
            notes=a.notes,
            created_at=a.created_at
        ))

    return results

@router.patch("/{alert_id}/assign", response_model=AlertOut)
def assign_alert(
    alert_id: str,
    assign_in: AlertAssignRequest,
    request: Request,
    current_user: User = Depends(require_roles(["admin", "doctor", "nurse"])),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).join(Patient).filter(
        Alert.id == alert_id,
        Patient.hospital_id == current_user.hospital_id
    ).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    assignee = db.query(User).filter(
        User.id == assign_in.assignee_id,
        User.hospital_id == current_user.hospital_id
    ).first()

    if not assignee:
        raise HTTPException(status_code=404, detail="Assigned staff member not found")

    alert.acknowledged_by = assignee.id
    if alert.status == "pending":
        alert.status = "acknowledged"
        alert.acknowledged_at = datetime.now(timezone.utc)

    assign_note = f"[Assigned to {assignee.full_name} ({assignee.role}) by {current_user.full_name}]"
    if assign_in.notes:
        assign_note += f": {assign_in.notes}"
    existing = f"{alert.notes}\n" if alert.notes else ""
    alert.notes = f"{existing}{assign_note}".strip()

    db.commit()
    db.refresh(alert)

    client_ip = request.client.host if request.client else "unknown"
    log_audit_event(
        db=db,
        action="ASSIGN_ALERT",
        resource_type="alert",
        resource_id=alert.id,
        user_id=current_user.id,
        details=f"Alert for {alert.patient.full_name} assigned to {assignee.full_name}",
        ip_address=client_ip
    )

    try:
        flags = json.loads(alert.flags) if alert.flags else []
    except Exception:
        flags = []

    return AlertOut(
        id=alert.id,
        patient_id=alert.patient_id,
        patient_name=alert.patient.full_name if alert.patient else None,
        patient_phone=alert.patient.phone if alert.patient else None,
        checkin_id=alert.checkin_id,
        care_plan_id=alert.care_plan_id,
        risk_level=alert.risk_level,
        summary=alert.summary,
        flags=flags,
        status=alert.status,
        acknowledged_by=alert.acknowledged_by,
        acknowledged_by_name=assignee.full_name,
        acknowledged_at=alert.acknowledged_at,
        action_taken=alert.action_taken,
        notes=alert.notes,
        created_at=alert.created_at
    )

@router.post("/{alert_id}/action", response_model=AlertOut)
def take_alert_action(
    alert_id: str,
    action_in: AlertActionRequest,
    request: Request,
    current_user: User = Depends(require_roles(["admin", "doctor", "nurse"])),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).join(Patient).filter(
        Alert.id == alert_id,
        Patient.hospital_id == current_user.hospital_id
    ).first()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    allowed_actions = ["call_patient", "schedule_visit", "escalate_to_doctor", "no_action_needed", "resolved"]
    if action_in.action not in allowed_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action '{action_in.action}'. Allowed: {allowed_actions}"
        )

    alert.status = "resolved" if action_in.action == "resolved" else "acknowledged"
    alert.acknowledged_by = current_user.id
    alert.acknowledged_at = datetime.now(timezone.utc)
    alert.action_taken = action_in.action
    if action_in.notes:
        existing = f"{alert.notes}\n" if alert.notes else ""
        alert.notes = f"{existing}[{current_user.full_name} ({current_user.role})]: {action_in.notes}".strip()

    db.commit()
    db.refresh(alert)

    # Audit log
    client_ip = request.client.host if request.client else "unknown"
    log_audit_event(
        db=db,
        action="ACKNOWLEDGE_ALERT" if alert.status != "resolved" else "RESOLVE_ALERT",
        resource_type="alert",
        resource_id=alert.id,
        user_id=current_user.id,
        details=f"Alert action '{action_in.action}' recorded by {current_user.full_name} for patient {alert.patient.full_name}. Notes: {action_in.notes or 'None'}",
        ip_address=client_ip
    )

    try:
        flags = json.loads(alert.flags) if alert.flags else []
    except Exception:
        flags = []

    return AlertOut(
        id=alert.id,
        patient_id=alert.patient_id,
        patient_name=alert.patient.full_name if alert.patient else None,
        patient_phone=alert.patient.phone if alert.patient else None,
        checkin_id=alert.checkin_id,
        care_plan_id=alert.care_plan_id,
        risk_level=alert.risk_level,
        summary=alert.summary,
        flags=flags,
        status=alert.status,
        acknowledged_by=alert.acknowledged_by,
        acknowledged_by_name=current_user.full_name,
        acknowledged_at=alert.acknowledged_at,
        action_taken=alert.action_taken,
        notes=alert.notes,
        created_at=alert.created_at
    )
