import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db import get_db
from app.models.models import (
    User, Patient, CarePlan, Checkin, Alert, Appointment, Admission, DischargeRecord,
    PatientNote, AuditLog
)
from app.schemas.schemas import (
    PatientOut, PatientDetailOut, CheckinOut, AlertOut, AppointmentOut, CarePlanOut,
    PatientNoteCreate, PatientNoteOut, AuditLogOut
)
from app.core.deps import get_current_user, require_roles, log_audit_event
from app.core.config import settings

router = APIRouter(prefix="/patients", tags=["patients"])

@router.get("", response_model=List[PatientOut])
def list_patients(
    search: Optional[str] = Query(None, description="Search by name, MRN, or phone"),
    risk_level: Optional[str] = Query(None, description="Filter by current risk level (low, medium, high)"),
    status_filter: Optional[str] = Query(None, description="Filter by care plan status (active, completed)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Patient).filter(Patient.hospital_id == current_user.hospital_id)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (Patient.full_name.ilike(search_pattern)) |
            (Patient.mrn.ilike(search_pattern)) |
            (Patient.phone.ilike(search_pattern))
        )

    patients = query.order_by(desc(Patient.created_at)).all()
    results = []

    for p in patients:
        active_care_plan = db.query(CarePlan).filter(
            CarePlan.patient_id == p.id,
            CarePlan.status == "active"
        ).first()

        latest_checkin = db.query(Checkin).filter(
            Checkin.patient_id == p.id
        ).order_by(desc(Checkin.submitted_at)).first()

        pending_alerts_count = db.query(Alert).filter(
            Alert.patient_id == p.id,
            Alert.status == "pending"
        ).count()

        current_risk = "low"
        if pending_alerts_count > 0:
            high_alert = db.query(Alert).filter(
                Alert.patient_id == p.id,
                Alert.status == "pending",
                Alert.risk_level == "high"
            ).first()
            current_risk = "high" if high_alert else "medium"
        elif latest_checkin:
            current_risk = latest_checkin.ai_risk_level

        if risk_level and current_risk != risk_level:
            continue

        if status_filter:
            plan_status = active_care_plan.status if active_care_plan else "completed"
            if plan_status != status_filter:
                continue

        results.append(PatientOut(
            id=p.id,
            mrn=p.mrn,
            full_name=p.full_name,
            phone=p.phone,
            email=p.email,
            date_of_birth=p.date_of_birth,
            gender=p.gender,
            access_token=p.access_token,
            token_expires_at=p.token_expires_at,
            latest_checkin_date=latest_checkin.date if latest_checkin else None,
            status=active_care_plan.status if active_care_plan else "discharged",
            current_risk_level=current_risk,
            pending_alerts_count=pending_alerts_count,
            created_at=p.created_at
        ))

    return results

@router.get("/{patient_id}", response_model=PatientDetailOut)
def get_patient_detail(
    patient_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.hospital_id == current_user.hospital_id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Get active or latest care plan
    care_plan = db.query(CarePlan).filter(
        CarePlan.patient_id == patient.id
    ).order_by(desc(CarePlan.created_at)).first()

    # Get diagnosis / discharge info
    diagnosis = None
    surgical_procedure = None
    discharge_instructions = None
    if care_plan and care_plan.discharge_record:
        discharge_instructions = care_plan.discharge_record.discharge_instructions
        surgical_procedure = care_plan.discharge_record.surgical_procedure
        if care_plan.discharge_record.admission:
            diagnosis = care_plan.discharge_record.admission.diagnosis

    # Get checkins
    checkins_db = db.query(Checkin).filter(
        Checkin.patient_id == patient.id
    ).order_by(desc(Checkin.submitted_at)).all()
    checkin_list = []
    for c in checkins_db:
        try:
            flags = json.loads(c.ai_flags) if c.ai_flags else []
        except Exception:
            flags = []
        try:
            missing = json.loads(c.ai_missing_info) if c.ai_missing_info else []
        except Exception:
            missing = []
        checkin_list.append(CheckinOut(
            id=c.id,
            patient_id=c.patient_id,
            care_plan_id=c.care_plan_id,
            date=c.date,
            submitted_at=c.submitted_at,
            pain_level=c.pain_level,
            has_fever=c.has_fever,
            temperature=c.temperature,
            has_swelling=c.has_swelling,
            swelling_details=c.swelling_details,
            eating_normally=c.eating_normally,
            sleeping_normally=c.sleeping_normally,
            moving_normally=c.moving_normally,
            medication_taken=c.medication_taken,
            missed_medication_reason=c.missed_medication_reason,
            new_symptoms=c.new_symptoms,
            callback_requested=c.callback_requested,
            callback_reason=c.callback_reason,
            ai_summary=c.ai_summary,
            ai_risk_level=c.ai_risk_level or "low",
            ai_flags=flags,
            ai_missing_info=missing
        ))

    # Alerts
    alerts_db = db.query(Alert).filter(
        Alert.patient_id == patient.id
    ).order_by(desc(Alert.created_at)).all()
    alert_list = []
    for a in alerts_db:
        try:
            flags = json.loads(a.flags) if a.flags else []
        except Exception:
            flags = []
        alert_list.append(AlertOut(
            id=a.id,
            patient_id=a.patient_id,
            patient_name=patient.full_name,
            patient_phone=patient.phone,
            checkin_id=a.checkin_id,
            care_plan_id=a.care_plan_id,
            risk_level=a.risk_level,
            summary=a.summary,
            flags=flags,
            status=a.status,
            acknowledged_by=a.acknowledged_by,
            acknowledged_by_name=a.reviewer.full_name if a.reviewer else None,
            acknowledged_at=a.acknowledged_at,
            action_taken=a.action_taken,
            notes=a.notes,
            created_at=a.created_at
        ))

    # Appointments
    appointments_db = db.query(Appointment).filter(
        Appointment.patient_id == patient.id
    ).order_by(Appointment.scheduled_at).all()
    appt_list = [
        AppointmentOut(
            id=ap.id,
            patient_id=ap.patient_id,
            care_plan_id=ap.care_plan_id,
            doctor_id=ap.doctor_id,
            scheduled_at=ap.scheduled_at,
            appointment_type=ap.appointment_type,
            status=ap.status,
            notes=ap.notes
        ) for ap in appointments_db
    ]

    # Audit log
    client_ip = request.client.host if request.client else "unknown"
    log_audit_event(
        db=db,
        action="VIEW_PATIENT",
        resource_type="patient",
        resource_id=patient.id,
        user_id=current_user.id,
        details=f"Viewed patient {patient.full_name} ({patient.mrn}) record",
        ip_address=client_ip
    )

    patient_link = f"{settings.PATIENT_PORTAL_URL}/{patient.access_token}"

    return PatientDetailOut(
        id=patient.id,
        mrn=patient.mrn,
        full_name=patient.full_name,
        phone=patient.phone,
        email=patient.email,
        date_of_birth=patient.date_of_birth,
        gender=patient.gender,
        access_token=patient.access_token,
        patient_link=patient_link,
        current_care_plan=care_plan,
        diagnosis=diagnosis,
        surgical_procedure=surgical_procedure,
        discharge_instructions=discharge_instructions,
        checkins=checkin_list,
        alerts=alert_list,
        appointments=appt_list,
        created_at=patient.created_at
    )

@router.get("/{patient_id}/notes", response_model=List[PatientNoteOut])
def get_patient_notes(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.hospital_id == current_user.hospital_id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    notes = db.query(PatientNote).filter(
        PatientNote.patient_id == patient_id
    ).order_by(desc(PatientNote.created_at)).all()

    results = []
    for n in notes:
        author = db.query(User).filter(User.id == n.author_id).first()
        results.append(PatientNoteOut(
            id=n.id,
            patient_id=n.patient_id,
            author_id=n.author_id,
            author_name=author.full_name if author else "Staff",
            author_role=author.role if author else "clinician",
            note_type=n.note_type,
            content=n.content,
            created_at=n.created_at
        ))
    return results

@router.post("/{patient_id}/notes", response_model=PatientNoteOut)
def add_patient_note(
    patient_id: str,
    note_in: PatientNoteCreate,
    request: Request,
    current_user: User = Depends(require_roles(["admin", "doctor", "nurse"])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.hospital_id == current_user.hospital_id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    new_note = PatientNote(
        patient_id=patient_id,
        author_id=current_user.id,
        note_type=note_in.note_type or "clinical",
        content=note_in.content
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    client_ip = request.client.host if request.client else "unknown"
    log_audit_event(
        db=db,
        action="ADD_PATIENT_NOTE",
        resource_type="patient_note",
        resource_id=new_note.id,
        user_id=current_user.id,
        details=f"Added {new_note.note_type} note for patient {patient.full_name}",
        ip_address=client_ip
    )

    return PatientNoteOut(
        id=new_note.id,
        patient_id=new_note.patient_id,
        author_id=new_note.author_id,
        author_name=current_user.full_name,
        author_role=current_user.role,
        note_type=new_note.note_type,
        content=new_note.content,
        created_at=new_note.created_at
    )

@router.get("/{patient_id}/activity")
def get_patient_activity(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.hospital_id == current_user.hospital_id
    ).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    logs = db.query(AuditLog).filter(
        (AuditLog.resource_id == patient_id) |
        (AuditLog.details.ilike(f"%{patient.full_name}%")) |
        (AuditLog.details.ilike(f"%{patient.mrn}%"))
    ).order_by(desc(AuditLog.created_at)).limit(50).all()

    results = []
    for lg in logs:
        u = db.query(User).filter(User.id == lg.user_id).first() if lg.user_id else None
        results.append({
            "id": lg.id,
            "action": lg.action,
            "user_name": u.full_name if u else "System",
            "user_role": u.role if u else "automated",
            "resource_type": lg.resource_type,
            "details": lg.details,
            "created_at": lg.created_at.isoformat() if lg.created_at else None
        })
    return results


