import json
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db import get_db
from app.models.models import (
    Patient, CarePlan, Checkin, Alert, Medication, Vital, User
)
from app.schemas.schemas import CheckinCreate, CheckinOut
from app.core.deps import get_patient_by_token, log_audit_event
from app.services.ai_service import ai_service
from app.services.notification_service import notification_service

router = APIRouter(prefix="/checkins", tags=["checkins"])

@router.get("/portal-info/{token}")
def get_portal_info(token: str, db: Session = Depends(get_db)):
    patient = get_patient_by_token(token, db)
    
    care_plan = db.query(CarePlan).filter(
        CarePlan.patient_id == patient.id,
        CarePlan.status == "active"
    ).order_by(desc(CarePlan.created_at)).first()

    if not care_plan:
        # Fallback to most recent care plan
        care_plan = db.query(CarePlan).filter(
            CarePlan.patient_id == patient.id
        ).order_by(desc(CarePlan.created_at)).first()

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_checkin = None
    if care_plan:
        today_checkin = db.query(Checkin).filter(
            Checkin.patient_id == patient.id,
            Checkin.care_plan_id == care_plan.id,
            Checkin.date == today_str
        ).first()

    procedure = "Post-Surgical Recovery"
    discharge_date = None
    days_post_op = 1
    if care_plan and care_plan.discharge_record:
        if care_plan.discharge_record.surgical_procedure:
            procedure = care_plan.discharge_record.surgical_procedure
        discharge_date = care_plan.discharge_record.discharged_at
        if discharge_date:
            delta = datetime.now(timezone.utc).date() - discharge_date.date()
            days_post_op = max(0, delta.days)

    medications = []
    if care_plan:
        meds = db.query(Medication).filter(
            Medication.care_plan_id == care_plan.id,
            Medication.is_active == True
        ).all()
        medications = [
            {"name": m.name, "dosage": m.dosage, "frequency": m.frequency, "purpose": m.purpose}
            for m in meds
        ]

    # Recent history
    recent_checkins = db.query(Checkin).filter(
        Checkin.patient_id == patient.id
    ).order_by(desc(Checkin.submitted_at)).limit(7).all()
    history = []
    for c in recent_checkins:
        try:
            flags = json.loads(c.ai_flags) if c.ai_flags else []
        except Exception:
            flags = []
        history.append({
            "id": c.id,
            "date": c.date,
            "pain_level": c.pain_level,
            "has_fever": c.has_fever,
            "temperature": c.temperature,
            "has_swelling": c.has_swelling,
            "medication_taken": c.medication_taken,
            "callback_requested": c.callback_requested,
            "ai_risk_level": c.ai_risk_level,
            "ai_summary": c.ai_summary,
            "ai_flags": flags
        })

    return {
        "patient_name": patient.full_name,
        "mrn": patient.mrn,
        "procedure": procedure,
        "days_post_op": days_post_op,
        "today_completed": today_checkin is not None,
        "today_checkin_id": today_checkin.id if today_checkin else None,
        "medications": medications,
        "history": history,
        "disclaimer": "AI-generated summary. Clinician review required.",
        "notice": "Illustrative workflow; clinical instructions must be customised and approved by the hospital."
    }

@router.post("/submit/{token}", response_model=CheckinOut)
def submit_checkin(
    token: str,
    checkin_in: CheckinCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    patient = get_patient_by_token(token, db)
    
    care_plan = db.query(CarePlan).filter(
        CarePlan.patient_id == patient.id,
        CarePlan.status == "active"
    ).order_by(desc(CarePlan.created_at)).first()

    if not care_plan:
        raise HTTPException(
            status_code=400,
            detail="No active recovery care plan found for this patient"
        )

    # Get previous check-ins to detect trends (e.g. pain rising 2+ points)
    prev_checkins_db = db.query(Checkin).filter(
        Checkin.patient_id == patient.id,
        Checkin.care_plan_id == care_plan.id
    ).order_by(desc(Checkin.submitted_at)).limit(3).all()

    prev_data = []
    for prev in prev_checkins_db:
        prev_data.append({
            "date": prev.date,
            "pain_level": prev.pain_level,
            "has_fever": prev.has_fever,
            "temperature": prev.temperature,
            "has_swelling": prev.has_swelling,
            "medication_taken": prev.medication_taken
        })

    current_data = checkin_in.model_dump()
    
    # Run AI analysis (Module 4) with strict guardrails
    ai_result = ai_service.analyze_checkin(
        current_data=current_data,
        previous_checkins=prev_data
    )

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Save check-in
    checkin = Checkin(
        patient_id=patient.id,
        care_plan_id=care_plan.id,
        date=today_str,
        submitted_at=datetime.now(timezone.utc),
        pain_level=checkin_in.pain_level,
        has_fever=checkin_in.has_fever,
        temperature=checkin_in.temperature,
        has_swelling=checkin_in.has_swelling,
        swelling_details=checkin_in.swelling_details,
        eating_normally=checkin_in.eating_normally,
        sleeping_normally=checkin_in.sleeping_normally,
        moving_normally=checkin_in.moving_normally,
        medication_taken=checkin_in.medication_taken,
        missed_medication_reason=checkin_in.missed_medication_reason,
        new_symptoms=checkin_in.new_symptoms,
        callback_requested=checkin_in.callback_requested,
        callback_reason=checkin_in.callback_reason,
        ai_summary=ai_result.summary,
        ai_risk_level=ai_result.risk_level,
        ai_flags=json.dumps(ai_result.flags),
        ai_missing_info=json.dumps(ai_result.missing_info)
    )
    db.add(checkin)
    db.flush()

    # Save vital if temperature recorded
    if checkin_in.temperature is not None:
        vital = Vital(
            checkin_id=checkin.id,
            patient_id=patient.id,
            vital_type="temperature",
            value=str(checkin_in.temperature),
            unit="°C"
        )
        db.add(vital)

    # Generate Alert if risk level is medium or high, or callback requested
    if ai_result.risk_level in ["medium", "high"] or checkin_in.callback_requested:
        alert = Alert(
            patient_id=patient.id,
            checkin_id=checkin.id,
            care_plan_id=care_plan.id,
            risk_level=ai_result.risk_level,
            summary=ai_result.summary,
            flags=json.dumps(ai_result.flags),
            status="pending",
            created_at=datetime.now(timezone.utc)
        )
        db.add(alert)

        # Notify hospital staff (Module 5 simulated notification)
        treating_doctor = care_plan.discharge_record.admission.treating_doctor if care_plan.discharge_record and care_plan.discharge_record.admission else None
        if treating_doctor:
            notification_service.send_staff_escalation(
                db=db,
                staff_user=treating_doctor,
                patient=patient,
                alert_summary=ai_result.summary,
                risk_level=ai_result.risk_level
            )

    db.commit()

    # Audit log
    client_ip = request.client.host if request.client else "unknown"
    log_audit_event(
        db=db,
        action="SUBMIT_CHECKIN",
        resource_type="checkin",
        resource_id=checkin.id,
        user_id=None,
        details=f"Patient {patient.full_name} submitted daily check-in (Risk: {ai_result.risk_level}, Pain: {checkin_in.pain_level})",
        ip_address=client_ip
    )

    return CheckinOut(
        id=checkin.id,
        patient_id=checkin.patient_id,
        care_plan_id=checkin.care_plan_id,
        date=checkin.date,
        submitted_at=checkin.submitted_at,
        pain_level=checkin.pain_level,
        has_fever=checkin.has_fever,
        temperature=checkin.temperature,
        has_swelling=checkin.has_swelling,
        swelling_details=checkin.swelling_details,
        eating_normally=checkin.eating_normally,
        sleeping_normally=checkin.sleeping_normally,
        moving_normally=checkin.moving_normally,
        medication_taken=checkin.medication_taken,
        missed_medication_reason=checkin.missed_medication_reason,
        new_symptoms=checkin.new_symptoms,
        callback_requested=checkin.callback_requested,
        callback_reason=checkin.callback_reason,
        ai_summary=checkin.ai_summary,
        ai_risk_level=checkin.ai_risk_level,
        ai_flags=ai_result.flags,
        ai_missing_info=ai_result.missing_info
    )

