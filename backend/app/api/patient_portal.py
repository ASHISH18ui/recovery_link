"""
AfterCare Patient Portal API
All endpoints under /patient-api prefix.
Patient isolation is enforced server-side: patient_id always comes from the JWT, never from request params.
"""
import json
import random
import string
import secrets
from datetime import datetime, timezone, timedelta, date
from typing import Optional, List, Any

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from pydantic import BaseModel, Field

from app.db import get_db
from app.core.deps import get_current_patient, log_audit_event
from app.core.security import create_access_token, get_password_hash, verify_password, decode_token
from app.models.models import (
    Patient, PatientAccount, PatientOTP, MedicationLog, PatientMessage,
    PatientVitalReading, RecoveryPlanDay, RescheduleRequest,
    CarePlan, Medication, Checkin, Appointment, Notification, Alert,
    AuditLog, DischargeRecord
)
from app.services.ai_service import ai_service
from app.services.notification_service import notification_service

router = APIRouter(prefix="/patient-api", tags=["patient-portal"])

AI_DISCLAIMER = "AI-generated summary. Clinician review required."
PORTAL_FOOTER = "Illustrative workflow; clinical instructions must be customised and approved by the hospital."


# ─── Pydantic schemas ────────────────────────────────────────────────────────

class PatientLoginRequest(BaseModel):
    username: str          # phone or email
    password: str

class PatientToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    must_change_password: bool
    patient_id: str
    patient_name: str
    preferred_language: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)

class ForgotPasswordRequest(BaseModel):
    username: str          # phone or email

class ResetPasswordRequest(BaseModel):
    username: str
    otp_code: str
    new_password: str = Field(min_length=6)

class ProfilePatch(BaseModel):
    emergency_contact: Optional[str] = None
    preferred_language: Optional[str] = None

class PatientCheckinCreate(BaseModel):
    pain_level: int = Field(ge=0, le=10)
    has_fever: bool = False
    temperature: Optional[float] = None
    has_swelling: bool = False
    swelling_details: Optional[str] = None
    wound_status: Optional[str] = None           # e.g. "healing well", "redness"
    breathing_difficulty: bool = False
    eating_normally: bool = True
    sleeping_normally: bool = True
    moving_normally: bool = True
    new_symptoms: Optional[str] = None
    mood: Optional[str] = None                    # "great","good","ok","low","bad"
    medication_taken: bool = True
    missed_medication_reason: Optional[str] = None
    # Optional vitals
    vital_temperature: Optional[float] = None
    vital_systolic_bp: Optional[int] = None
    vital_diastolic_bp: Optional[int] = None
    vital_pulse: Optional[int] = None
    vital_spo2: Optional[float] = None
    vital_weight_kg: Optional[float] = None
    vital_blood_sugar: Optional[float] = None
    # Optional photo (base64, max ~700KB)
    site_photo_b64: Optional[str] = None

class MedicationLogCreate(BaseModel):
    log_date: Optional[str] = None   # YYYY-MM-DD, defaults to today
    status: str                        # "taken" | "skipped"
    notes: Optional[str] = None

class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)

class RescheduleCreate(BaseModel):
    reason: str = Field(min_length=5)
    preferred_dates: Optional[str] = None   # free text

class EmergencyAlertCreate(BaseModel):
    description: Optional[str] = "Patient triggered emergency alert from patient portal."


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _get_active_care_plan(patient_id: str, db: Session) -> Optional[CarePlan]:
    return (
        db.query(CarePlan)
        .filter(CarePlan.patient_id == patient_id, CarePlan.status == "active")
        .order_by(CarePlan.created_at.desc())
        .first()
    )

def _days_since_discharge(care_plan: CarePlan) -> int:
    if not care_plan:
        return 0
    start = care_plan.start_date
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    return max(0, (datetime.now(timezone.utc) - start).days)

def _today_str() -> str:
    return date.today().isoformat()

def _make_flag_rules(c: PatientCheckinCreate) -> List[str]:
    flags = []
    if c.pain_level >= 7:
        flags.append(f"High pain level reported: {c.pain_level}/10")
    if c.has_fever:
        flags.append("Fever reported")
        if c.temperature and c.temperature > 38.5:
            flags.append(f"High temperature: {c.temperature}°C")
    if c.breathing_difficulty:
        flags.append("Breathing difficulty reported")
    if c.has_swelling:
        flags.append("Swelling at surgical site")
    if not c.medication_taken:
        flags.append("Medication not taken")
    if c.new_symptoms:
        flags.append(f"New symptoms: {c.new_symptoms[:80]}")
    return flags

def _risk_from_flags(flags: List[str], pain_level: int) -> str:
    if len(flags) >= 3 or pain_level >= 8:
        return "high"
    if len(flags) >= 1 or pain_level >= 5:
        return "medium"
    return "low"


# ─── Auth endpoints ───────────────────────────────────────────────────────────

@router.post("/login", response_model=PatientToken)
def patient_login(payload: PatientLoginRequest, db: Session = Depends(get_db)):
    username = payload.username.strip()
    # Find by phone or email
    account = (
        db.query(PatientAccount)
        .filter(or_(PatientAccount.phone == username, PatientAccount.email == username))
        .first()
    )
    if not account or not verify_password(payload.password, account.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
    if not account.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account is inactive")

    account.last_login_at = datetime.now(timezone.utc)
    db.commit()

    patient = db.query(Patient).filter(Patient.id == account.patient_id).first()

    # Audit
    log_audit_event(db, "PATIENT_LOGIN", "patient_account", account.id,
                    details=f"Patient {patient.full_name} logged in to patient portal")

    token = create_access_token(subject=account.id, role="patient", expires_delta=timedelta(hours=72))
    return PatientToken(
        access_token=token,
        must_change_password=account.must_change_password,
        patient_id=account.patient_id,
        patient_name=patient.full_name,
        preferred_language=account.preferred_language or "en",
    )


@router.post("/change-password", status_code=200)
def change_password(
    payload: ChangePasswordRequest,
    current_patient: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_patient.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    current_patient.hashed_password = get_password_hash(payload.new_password)
    current_patient.must_change_password = False
    db.commit()
    return {"message": "Password changed successfully"}


@router.post("/forgot-password", status_code=200)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    username = payload.username.strip()
    account = (
        db.query(PatientAccount)
        .filter(or_(PatientAccount.phone == username, PatientAccount.email == username))
        .first()
    )
    # Always return success (don't leak whether account exists)
    if account:
        # Generate 6-digit OTP
        otp_code = "".join(random.choices(string.digits, k=6))
        otp = PatientOTP(
            patient_account_id=account.id,
            otp_code=otp_code,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        )
        db.add(otp)
        # Store OTP in notification log so staff can see it (simulated)
        patient = db.query(Patient).filter(Patient.id == account.patient_id).first()
        if patient:
            notification_service.send_notification(
                db=db,
                notification_type="otp",
                channel="sms",
                recipient_contact=account.phone or account.email or "unknown",
                message=f"[SIMULATED OTP] Your AfterCare password reset code is: {otp_code}. Valid for 15 minutes.",
                patient_id=patient.id,
            )
        db.commit()
    return {"message": "If an account was found, an OTP has been sent to your registered contact."}


@router.post("/reset-password", status_code=200)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    username = payload.username.strip()
    account = (
        db.query(PatientAccount)
        .filter(or_(PatientAccount.phone == username, PatientAccount.email == username))
        .first()
    )
    if not account:
        raise HTTPException(status_code=400, detail="Invalid request")

    otp = (
        db.query(PatientOTP)
        .filter(
            PatientOTP.patient_account_id == account.id,
            PatientOTP.otp_code == payload.otp_code,
            PatientOTP.is_used == False,
            PatientOTP.expires_at > datetime.now(timezone.utc),
        )
        .first()
    )
    if not otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    otp.is_used = True
    account.hashed_password = get_password_hash(payload.new_password)
    account.must_change_password = False
    db.commit()
    return {"message": "Password reset successfully"}


# ─── Profile / Me ─────────────────────────────────────────────────────────────

@router.get("/me")
def get_me(
    current_patient: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.id == current_patient.patient_id).first()
    care_plan = _get_active_care_plan(current_patient.patient_id, db)
    today = _today_str()

    today_checkin = None
    if care_plan:
        today_checkin = (
            db.query(Checkin)
            .filter(Checkin.patient_id == current_patient.patient_id, Checkin.date == today)
            .first()
        )

    days_in_recovery = _days_since_discharge(care_plan) if care_plan else 0
    plan_duration = (care_plan.end_date - care_plan.start_date).days if care_plan and care_plan.end_date else 14

    # Today's medications
    meds = []
    if care_plan:
        meds = db.query(Medication).filter(
            Medication.care_plan_id == care_plan.id,
            Medication.is_active == True
        ).all()

    # Next appointment
    next_appt = None
    if care_plan:
        next_appt = (
            db.query(Appointment)
            .filter(
                Appointment.patient_id == current_patient.patient_id,
                Appointment.status == "scheduled",
                Appointment.scheduled_at > datetime.now(timezone.utc)
            )
            .order_by(Appointment.scheduled_at)
            .first()
        )

    # Medication logs for today
    today_date = date.today()
    med_logs_today = (
        db.query(MedicationLog)
        .filter(MedicationLog.patient_id == current_patient.patient_id, MedicationLog.log_date == today_date)
        .all()
    )
    logged_med_ids = {ml.medication_id: ml.status for ml in med_logs_today}

    return {
        "patient": {
            "id": patient.id,
            "full_name": patient.full_name,
            "phone": patient.phone,
            "email": patient.email,
            "date_of_birth": patient.date_of_birth,
            "gender": patient.gender,
            "emergency_contact": patient.emergency_contact,
            "mrn": patient.mrn,
        },
        "account": {
            "preferred_language": current_patient.preferred_language,
            "must_change_password": current_patient.must_change_password,
        },
        "recovery": {
            "days_in_recovery": days_in_recovery,
            "plan_duration_days": plan_duration,
            "progress_percent": min(100, round(days_in_recovery / max(plan_duration, 1) * 100)),
            "care_plan_status": care_plan.status if care_plan else None,
            "follow_up_date": care_plan.follow_up_date.isoformat() if care_plan and care_plan.follow_up_date else None,
        },
        "today_tasks": {
            "checkin_done": today_checkin is not None,
            "checkin_id": today_checkin.id if today_checkin else None,
            "medicines_total": len(meds),
            "medicines_logged": len(med_logs_today),
            "has_appointment_today": (
                next_appt is not None and next_appt.scheduled_at.date() == date.today()
            ) if next_appt else False,
        },
        "next_appointment": {
            "id": next_appt.id,
            "scheduled_at": next_appt.scheduled_at.isoformat(),
            "appointment_type": next_appt.appointment_type,
            "notes": next_appt.notes,
        } if next_appt else None,
        "disclaimer": AI_DISCLAIMER,
        "footer": PORTAL_FOOTER,
    }


@router.patch("/profile")
def update_profile(
    payload: ProfilePatch,
    current_patient: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.id == current_patient.patient_id).first()
    if payload.emergency_contact is not None:
        patient.emergency_contact = payload.emergency_contact
    if payload.preferred_language is not None:
        current_patient.preferred_language = payload.preferred_language
    db.commit()
    return {"message": "Profile updated successfully"}


# ─── Check-ins ────────────────────────────────────────────────────────────────

@router.post("/checkins")
def submit_checkin(
    payload: PatientCheckinCreate,
    current_patient: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    patient_id = current_patient.patient_id
    care_plan = _get_active_care_plan(patient_id, db)
    if not care_plan:
        raise HTTPException(status_code=404, detail="No active care plan found")

    today = _today_str()
    # Only one check-in per day
    existing = db.query(Checkin).filter(
        Checkin.patient_id == patient_id, Checkin.date == today
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="You have already checked in today. Use PUT to update.")

    flags = _make_flag_rules(payload)
    risk_level = _risk_from_flags(flags, payload.pain_level)

    # Build AI summary
    summary_input = {
        "pain_level": payload.pain_level,
        "has_fever": payload.has_fever,
        "temperature": payload.temperature,
        "has_swelling": payload.has_swelling,
        "breathing_difficulty": payload.breathing_difficulty,
        "wound_status": payload.wound_status,
        "eating_normally": payload.eating_normally,
        "sleeping_normally": payload.sleeping_normally,
        "moving_normally": payload.moving_normally,
        "new_symptoms": payload.new_symptoms,
        "mood": payload.mood,
        "medication_taken": payload.medication_taken,
        "missed_medication_reason": payload.missed_medication_reason,
    }
    try:
        ai_result = ai_service.analyze_checkin(summary_input)
        ai_summary = ai_result.get("summary", "Patient submitted daily check-in.")
        ai_risk_level = ai_result.get("risk_level", risk_level)
        ai_flags_list = ai_result.get("flags", flags)
    except Exception:
        ai_summary = f"Patient reported pain level {payload.pain_level}/10. {'Fever present. ' if payload.has_fever else ''}{'Swelling noted. ' if payload.has_swelling else ''}Check-in logged."
        ai_risk_level = risk_level
        ai_flags_list = flags

    # Store site photo in new_symptoms field extension (store b64 reference)
    new_symptoms_val = payload.new_symptoms or ""

    checkin = Checkin(
        patient_id=patient_id,
        care_plan_id=care_plan.id,
        date=today,
        pain_level=payload.pain_level,
        has_fever=payload.has_fever,
        temperature=payload.temperature or payload.vital_temperature,
        has_swelling=payload.has_swelling,
        swelling_details=payload.swelling_details,
        eating_normally=payload.eating_normally,
        sleeping_normally=payload.sleeping_normally,
        moving_normally=payload.moving_normally,
        medication_taken=payload.medication_taken,
        missed_medication_reason=payload.missed_medication_reason,
        new_symptoms=new_symptoms_val or None,
        callback_requested=payload.breathing_difficulty,
        ai_summary=ai_summary,
        ai_risk_level=ai_risk_level,
        ai_flags=json.dumps(ai_flags_list),
        ai_missing_info=json.dumps([]),
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(checkin)
    db.flush()

    # Save vitals if provided
    has_vitals = any([
        payload.vital_temperature, payload.vital_systolic_bp, payload.vital_diastolic_bp,
        payload.vital_pulse, payload.vital_spo2, payload.vital_weight_kg, payload.vital_blood_sugar,
    ])
    if has_vitals:
        vital_reading = PatientVitalReading(
            patient_id=patient_id,
            checkin_id=checkin.id,
            reading_date=date.today(),
            temperature=payload.vital_temperature or payload.temperature,
            systolic_bp=payload.vital_systolic_bp,
            diastolic_bp=payload.vital_diastolic_bp,
            pulse=payload.vital_pulse,
            spo2=payload.vital_spo2,
            weight_kg=payload.vital_weight_kg,
            blood_sugar=payload.vital_blood_sugar,
        )
        db.add(vital_reading)

    # Create alert if medium or high risk
    care_team_notified = False
    if ai_risk_level in ("medium", "high"):
        alert = Alert(
            patient_id=patient_id,
            checkin_id=checkin.id,
            care_plan_id=care_plan.id,
            risk_level=ai_risk_level,
            summary=f"[Patient Portal Check-in] {ai_summary}",
            flags=json.dumps(ai_flags_list),
            status="pending",
            created_at=datetime.now(timezone.utc),
        )
        db.add(alert)
        care_team_notified = True

        # Notification to staff
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        notification_service.send_notification(
            db=db,
            notification_type="staff_escalation",
            channel="in_app",
            recipient_contact="staff",
            message=f"[{ai_risk_level.upper()} RISK] {patient.full_name} submitted a check-in with concerns. {ai_summary[:100]}",
            patient_id=patient_id,
            care_plan_id=care_plan.id,
        )

    db.commit()

    return {
        "checkin_id": checkin.id,
        "ai_summary": ai_summary,
        "ai_risk_level": ai_risk_level,
        "ai_flags": ai_flags_list,
        "care_team_notified": care_team_notified,
        "disclaimer": AI_DISCLAIMER,
    }


@router.get("/checkins")
def get_checkins(
    current_patient: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    checkins = (
        db.query(Checkin)
        .filter(Checkin.patient_id == current_patient.patient_id)
        .order_by(Checkin.date.desc())
        .limit(30)
        .all()
    )
    result = []
    for c in checkins:
        result.append({
            "id": c.id,
            "date": c.date,
            "submitted_at": c.submitted_at.isoformat() if c.submitted_at else None,
            "pain_level": c.pain_level,
            "has_fever": c.has_fever,
            "temperature": c.temperature,
            "has_swelling": c.has_swelling,
            "eating_normally": c.eating_normally,
            "sleeping_normally": c.sleeping_normally,
            "moving_normally": c.moving_normally,
            "medication_taken": c.medication_taken,
            "new_symptoms": c.new_symptoms,
            "ai_summary": c.ai_summary,
            "ai_risk_level": c.ai_risk_level,
            "ai_flags": json.loads(c.ai_flags) if c.ai_flags else [],
            "disclaimer": AI_DISCLAIMER,
        })
    return result


@router.get("/checkins/today")
def get_today_checkin(
    current_patient: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    today = _today_str()
    checkin = db.query(Checkin).filter(
        Checkin.patient_id == current_patient.patient_id,
        Checkin.date == today
    ).first()
    if not checkin:
        return {"checked_in": False}
    return {
        "checked_in": True,
        "checkin": {
            "id": checkin.id,
            "date": checkin.date,
            "pain_level": checkin.pain_level,
            "has_fever": checkin.has_fever,
            "has_swelling": checkin.has_swelling,
            "medication_taken": checkin.medication_taken,
            "new_symptoms": checkin.new_symptoms,
            "ai_summary": checkin.ai_summary,
            "ai_risk_level": checkin.ai_risk_level,
            "ai_flags": json.loads(checkin.ai_flags) if checkin.ai_flags else [],
            "disclaimer": AI_DISCLAIMER,
        },
    }


# ─── Medications ──────────────────────────────────────────────────────────────

@router.get("/medications")
def get_medications(
    current_patient: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    care_plan = _get_active_care_plan(current_patient.patient_id, db)
    if not care_plan:
        return {"medications": [], "logs_today": [], "adherence_percent": 0}

    meds = db.query(Medication).filter(
        Medication.care_plan_id == care_plan.id,
        Medication.is_active == True
    ).all()

    today_date = date.today()
    logs_today = (
        db.query(MedicationLog)
        .filter(
            MedicationLog.patient_id == current_patient.patient_id,
            MedicationLog.log_date == today_date,
        )
        .all()
    )
    logged_map = {ml.medication_id: ml.status for ml in logs_today}

    # Calculate 7-day adherence
    seven_days_ago = today_date - timedelta(days=7)
    all_logs = (
        db.query(MedicationLog)
        .filter(
            MedicationLog.patient_id == current_patient.patient_id,
            MedicationLog.log_date >= seven_days_ago,
        )
        .all()
    )
    taken_count = sum(1 for l in all_logs if l.status == "taken")
    adherence_pct = round(taken_count / max(len(all_logs), 1) * 100) if all_logs else 0

    return {
        "medications": [
            {
                "id": m.id,
                "name": m.name,
                "dosage": m.dosage,
                "frequency": m.frequency,
                "purpose": m.purpose,
                "today_status": logged_map.get(m.id),
            }
            for m in meds
        ],
        "logs_today": [
            {"medication_id": l.medication_id, "status": l.status, "notes": l.notes}
            for l in logs_today
        ],
        "adherence_percent": adherence_pct,
    }


@router.post("/medications/{medication_id}/log")
def log_medication(
    medication_id: str,
    payload: MedicationLogCreate,
    current_patient: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    # Verify medication belongs to patient's care plan
    care_plan = _get_active_care_plan(current_patient.patient_id, db)
    if not care_plan:
        raise HTTPException(status_code=404, detail="No active care plan")

    med = db.query(Medication).filter(
        Medication.id == medication_id,
        Medication.care_plan_id == care_plan.id,
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medication not found in your care plan")

    log_date = date.fromisoformat(payload.log_date) if payload.log_date else date.today()

    # Upsert (delete existing log for same date, then add new)
    existing = db.query(MedicationLog).filter(
        MedicationLog.medication_id == medication_id,
        MedicationLog.patient_id == current_patient.patient_id,
        MedicationLog.log_date == log_date,
    ).first()
    if existing:
        existing.status = payload.status
        existing.notes = payload.notes
        existing.logged_at = datetime.now(timezone.utc)
    else:
        db.add(MedicationLog(
            medication_id=medication_id,
            patient_id=current_patient.patient_id,
            log_date=log_date,
            status=payload.status,
            notes=payload.notes,
        ))
    db.commit()
    return {"message": f"Medication logged as {payload.status}"}


# ─── Appointments ─────────────────────────────────────────────────────────────

@router.get("/appointments")
def get_appointments(
    current_patient: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    appointments = (
        db.query(Appointment)
        .filter(Appointment.patient_id == current_patient.patient_id)
        .order_by(Appointment.scheduled_at)
        .all()
    )
    now = datetime.now(timezone.utc)
    result = []
    for a in appointments:
        sat = a.scheduled_at
        if sat.tzinfo is None:
            sat = sat.replace(tzinfo=timezone.utc)
        result.append({
            "id": a.id,
            "scheduled_at": sat.isoformat(),
            "appointment_type": a.appointment_type,
            "status": a.status,
            "notes": a.notes,
            "is_upcoming": sat > now and a.status == "scheduled",
        })
    return result


@router.post("/appointments/{appointment_id}/reschedule-request")
def request_reschedule(
    appointment_id: str,
    payload: RescheduleCreate,
    current_patient: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    # Verify ownership
    appt = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.patient_id == current_patient.patient_id,
    ).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    req = RescheduleRequest(
        appointment_id=appointment_id,
        patient_id=current_patient.patient_id,
        reason=payload.reason,
        preferred_dates=payload.preferred_dates,
    )
    db.add(req)

    # Notify staff
    patient = db.query(Patient).filter(Patient.id == current_patient.patient_id).first()
    notification_service.send_notification(
        db=db,
        notification_type="appointment_reminder",
        channel="in_app",
        recipient_contact="staff",
        message=f"{patient.full_name} has requested to reschedule appointment on {appt.scheduled_at.strftime('%b %d, %Y')}. Reason: {payload.reason[:60]}",
        patient_id=current_patient.patient_id,
    )
    db.commit()
    return {"message": "Reschedule request submitted. The care team will contact you."}


# ─── Messages ─────────────────────────────────────────────────────────────────

@router.get("/messages")
def get_messages(
    current_patient: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    messages = (
        db.query(PatientMessage)
        .filter(PatientMessage.patient_id == current_patient.patient_id)
        .order_by(PatientMessage.created_at.asc())
        .all()
    )
    return [
        {
            "id": m.id,
            "sender_role": m.sender_role,
            "sender_name": m.sender_name or ("You" if m.sender_role == "patient" else "Care Team"),
            "content": m.content,
            "message_status": m.message_status,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]


@router.post("/messages")
def send_message(
    payload: MessageCreate,
    current_patient: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.id == current_patient.patient_id).first()
    msg = PatientMessage(
        patient_id=current_patient.patient_id,
        sender_role="patient",
        sender_id=None,
        sender_name=patient.full_name if patient else "Patient",
        content=payload.content,
    )
    db.add(msg)

    # Notify staff via notification log
    notification_service.send_notification(
        db=db,
        notification_type="staff_escalation",
        channel="in_app",
        recipient_contact="staff",
        message=f"Message from {patient.full_name}: {payload.content[:80]}",
        patient_id=current_patient.patient_id,
    )
    db.commit()

    # Auto-reply from "care team" for demo
    auto_reply = PatientMessage(
        patient_id=current_patient.patient_id,
        sender_role="system",
        sender_id=None,
        sender_name="AfterCare Team",
        content="Thank you for your message. A member of your care team will respond within 24 hours. If this is an emergency, please call your hospital helpline or tap 'I need help'.",
        message_status="sent",
    )
    db.add(auto_reply)
    db.commit()
    return {"message": "Message sent", "id": msg.id}


# ─── Recovery Plan ────────────────────────────────────────────────────────────

@router.get("/recovery-plan")
def get_recovery_plan(
    current_patient: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    care_plan = _get_active_care_plan(current_patient.patient_id, db)
    if not care_plan:
        return {"care_plan": None, "days": [], "footer": PORTAL_FOOTER}

    days = (
        db.query(RecoveryPlanDay)
        .filter(RecoveryPlanDay.care_plan_id == care_plan.id)
        .order_by(RecoveryPlanDay.day_number)
        .all()
    )

    # Fallback: generate generic plan days if none seeded
    if not days:
        days_since = _days_since_discharge(care_plan)
        plan_dur = (care_plan.end_date - care_plan.start_date).days if care_plan.end_date else 14
        generated = []
        for d in range(1, plan_dur + 1):
            generated.append({
                "day_number": d,
                "title": f"Day {d}",
                "instructions": "Follow your discharge instructions. Take all medications as prescribed. Rest and avoid strenuous activity.",
                "diet_notes": "Light nutritious meals. Stay well hydrated.",
                "exercise_notes": "Gentle walking as tolerated. No heavy lifting.",
                "warning_signs": json.dumps(["High fever (>38.5°C)", "Severe pain", "Wound opening or discharge"]),
                "milestones": json.dumps([]),
                "is_completed": d <= days_since,
            })
        return {"care_plan": {"id": care_plan.id, "status": care_plan.status}, "days": generated, "footer": PORTAL_FOOTER}

    days_since = _days_since_discharge(care_plan)
    result = []
    for d in days:
        result.append({
            "day_number": d.day_number,
            "title": d.title,
            "instructions": d.instructions,
            "diet_notes": d.diet_notes,
            "exercise_notes": d.exercise_notes,
            "warning_signs": json.loads(d.warning_signs) if d.warning_signs else [],
            "milestones": json.loads(d.milestones) if d.milestones else [],
            "is_completed": d.day_number <= days_since or d.is_completed,
        })

    return {"care_plan": {"id": care_plan.id, "status": care_plan.status}, "days": result, "footer": PORTAL_FOOTER}


# ─── Progress / Vitals ────────────────────────────────────────────────────────

@router.get("/vitals")
def get_vitals(
    current_patient: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    readings = (
        db.query(PatientVitalReading)
        .filter(PatientVitalReading.patient_id == current_patient.patient_id)
        .order_by(PatientVitalReading.reading_date.asc())
        .limit(30)
        .all()
    )
    checkins = (
        db.query(Checkin)
        .filter(Checkin.patient_id == current_patient.patient_id)
        .order_by(Checkin.date.asc())
        .limit(30)
        .all()
    )
    return {
        "vitals": [
            {
                "date": str(r.reading_date),
                "temperature": r.temperature,
                "systolic_bp": r.systolic_bp,
                "diastolic_bp": r.diastolic_bp,
                "pulse": r.pulse,
                "spo2": r.spo2,
                "weight_kg": r.weight_kg,
                "blood_sugar": r.blood_sugar,
            }
            for r in readings
        ],
        "pain_trend": [
            {"date": c.date, "pain_level": c.pain_level, "ai_risk_level": c.ai_risk_level}
            for c in checkins
        ],
    }


# ─── Notifications ────────────────────────────────────────────────────────────

@router.get("/notifications")
def get_notifications(
    current_patient: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    notifs = (
        db.query(Notification)
        .filter(Notification.patient_id == current_patient.patient_id)
        .order_by(Notification.sent_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": n.id,
            "notification_type": n.notification_type,
            "channel": n.channel,
            "message": n.message,
            "status": n.status,
            "sent_at": n.sent_at.isoformat() if n.sent_at else None,
        }
        for n in notifs
    ]


# ─── Documents ────────────────────────────────────────────────────────────────

@router.get("/documents")
def get_documents(
    current_patient: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    care_plan = _get_active_care_plan(current_patient.patient_id, db)
    if not care_plan:
        return {"discharge_instructions": None, "surgical_procedure": None, "care_plan": None}

    discharge_record = db.query(DischargeRecord).filter(
        DischargeRecord.id == care_plan.discharge_id
    ).first()

    meds = db.query(Medication).filter(
        Medication.care_plan_id == care_plan.id
    ).all()

    return {
        "discharge_instructions": discharge_record.discharge_instructions if discharge_record else None,
        "surgical_procedure": discharge_record.surgical_procedure if discharge_record else None,
        "care_plan": {
            "id": care_plan.id,
            "start_date": care_plan.start_date.isoformat() if care_plan.start_date else None,
            "end_date": care_plan.end_date.isoformat() if care_plan.end_date else None,
            "follow_up_date": care_plan.follow_up_date.isoformat() if care_plan.follow_up_date else None,
            "status": care_plan.status,
        },
        "medications": [
            {"name": m.name, "dosage": m.dosage, "frequency": m.frequency, "purpose": m.purpose}
            for m in meds
        ],
        "footer": PORTAL_FOOTER,
    }


# ─── Emergency ───────────────────────────────────────────────────────────────

@router.post("/emergency")
def trigger_emergency(
    payload: EmergencyAlertCreate,
    current_patient: PatientAccount = Depends(get_current_patient),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.id == current_patient.patient_id).first()
    care_plan = _get_active_care_plan(current_patient.patient_id, db)
    if not care_plan:
        raise HTTPException(status_code=404, detail="No active care plan")

    alert = Alert(
        patient_id=current_patient.patient_id,
        care_plan_id=care_plan.id,
        risk_level="high",
        summary=f"[EMERGENCY] Patient {patient.full_name} triggered emergency alert from patient portal. {payload.description}",
        flags=json.dumps(["Patient-triggered emergency alert"]),
        status="pending",
        created_at=datetime.now(timezone.utc),
    )
    db.add(alert)

    notification_service.send_notification(
        db=db,
        notification_type="staff_escalation",
        channel="whatsapp",
        recipient_contact="staff",
        message=f"⚠️ EMERGENCY: {patient.full_name} needs immediate attention. Contact: {patient.phone}. {payload.description[:100]}",
        patient_id=current_patient.patient_id,
        care_plan_id=care_plan.id,
    )
    db.commit()
    return {"message": "Emergency alert sent to your care team. Help is on the way.", "alert_id": alert.id}
