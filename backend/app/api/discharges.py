import secrets
from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.models import (
    User, Patient, Admission, DischargeRecord, CarePlan, Medication, Appointment
)
from app.schemas.schemas import DischargeCreate, DischargeOut
from app.core.deps import get_current_user, require_roles, log_audit_event
from app.core.config import settings
from app.services.notification_service import notification_service

router = APIRouter(prefix="/discharges", tags=["discharges"])

@router.post("", response_model=DischargeOut)
def create_discharge(
    discharge_in: DischargeCreate,
    request: Request,
    current_user: User = Depends(require_roles(["admin", "doctor", "nurse"])),
    db: Session = Depends(get_db)
):
    # Check if patient exists with this phone or MRN in current hospital
    patient = None
    if discharge_in.mrn:
        patient = db.query(Patient).filter(
            Patient.hospital_id == current_user.hospital_id,
            Patient.mrn == discharge_in.mrn
        ).first()

    if not patient:
        patient = db.query(Patient).filter(
            Patient.hospital_id == current_user.hospital_id,
            Patient.phone == discharge_in.phone
        ).first()

    # Generate secure, expiring, non-guessable access token
    secure_token = secrets.token_urlsafe(32)
    # Token valid for 30 days post-discharge
    token_expiry = datetime.now(timezone.utc) + timedelta(days=30)

    if not patient:
        patient = Patient(
            hospital_id=current_user.hospital_id,
            mrn=discharge_in.mrn or f"MRN-{secrets.token_hex(4).upper()}",
            full_name=discharge_in.full_name,
            phone=discharge_in.phone,
            email=discharge_in.email,
            date_of_birth=discharge_in.date_of_birth,
            gender=discharge_in.gender or "Other",
            emergency_contact=discharge_in.emergency_contact,
            access_token=secure_token,
            token_expires_at=token_expiry
        )
        db.add(patient)
        db.flush()
    else:
        # Refresh token on new discharge
        patient.access_token = secure_token
        patient.token_expires_at = token_expiry
        if discharge_in.full_name:
            patient.full_name = discharge_in.full_name
        if discharge_in.email:
            patient.email = discharge_in.email

    # Create Admission
    admitted_time = discharge_in.admitted_at or (datetime.now(timezone.utc) - timedelta(days=2))
    admission = Admission(
        patient_id=patient.id,
        admitted_at=admitted_time,
        diagnosis=discharge_in.diagnosis,
        treating_doctor_id=discharge_in.treating_doctor_id,
        status="discharged"
    )
    db.add(admission)
    db.flush()

    # Create DischargeRecord
    discharged_time = discharge_in.discharged_at or datetime.now(timezone.utc)
    discharge_record = DischargeRecord(
        admission_id=admission.id,
        discharged_at=discharged_time,
        surgical_procedure=discharge_in.surgical_procedure or discharge_in.diagnosis,
        discharge_instructions=discharge_in.discharge_instructions,
        discharged_by=current_user.id
    )
    db.add(discharge_record)
    db.flush()

    # Create CarePlan
    care_plan = CarePlan(
        discharge_id=discharge_record.id,
        patient_id=patient.id,
        start_date=discharged_time,
        end_date=discharged_time + timedelta(days=14),
        follow_up_date=discharge_in.follow_up_date or (discharged_time + timedelta(days=7)),
        status="active"
    )
    db.add(care_plan)
    db.flush()

    # Add Medications
    for med in discharge_in.medications:
        medication_obj = Medication(
            care_plan_id=care_plan.id,
            name=med.name,
            dosage=med.dosage,
            frequency=med.frequency,
            purpose=med.purpose,
            is_active=True
        )
        db.add(medication_obj)

    # If follow-up date provided, create follow-up appointment
    if discharge_in.follow_up_date:
        appt = Appointment(
            patient_id=patient.id,
            care_plan_id=care_plan.id,
            doctor_id=discharge_in.treating_doctor_id,
            scheduled_at=discharge_in.follow_up_date,
            appointment_type="Post-Op Clinical Review",
            status="scheduled",
            notes="Scheduled at discharge"
        )
        db.add(appt)

    db.commit()

    # Send simulated onboarding notification
    patient_link = f"{settings.PATIENT_PORTAL_URL}/{patient.access_token}"
    notification = notification_service.send_patient_onboarding(
        db=db,
        patient=patient,
        care_plan=care_plan,
        portal_url=settings.PATIENT_PORTAL_URL
    )

    # Schedule standard follow-up appointment reminder
    if discharge_in.follow_up_date:
        appt_str = discharge_in.follow_up_date.strftime("%b %d, %Y")
        notification_service.send_notification(
            db=db,
            notification_type="appointment_reminder",
            channel="sms",
            recipient_contact=patient.phone,
            message=f"Reminder: You have an upcoming post-op appointment with your surgical team on {appt_str}.",
            patient_id=patient.id,
            care_plan_id=care_plan.id
        )

    # Audit log
    client_ip = request.client.host if request.client else "unknown"
    log_audit_event(
        db=db,
        action="CREATE_DISCHARGE",
        resource_type="discharge_record",
        resource_id=discharge_record.id,
        user_id=current_user.id,
        details=f"Discharge created for patient {patient.full_name} ({patient.mrn}) by {current_user.full_name}",
        ip_address=client_ip
    )

    return DischargeOut(
        discharge_id=discharge_record.id,
        admission_id=admission.id,
        patient_id=patient.id,
        patient_name=patient.full_name,
        patient_token=patient.access_token,
        patient_link=patient_link,
        simulated_message=notification.message,
        created_at=discharge_record.created_at
    )

