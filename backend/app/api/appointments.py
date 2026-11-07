from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db import get_db
from app.models.models import Appointment, Patient, User, CarePlan, Notification
from app.schemas.schemas import AppointmentCreate, AppointmentOut, AppointmentUpdate
from app.core.deps import get_current_user, require_roles, log_audit_event

router = APIRouter(prefix="/appointments", tags=["appointments"])

@router.get("", response_model=List[dict])
def list_appointments(
    status: Optional[str] = Query(None, description="Filter by status: scheduled, completed, cancelled, all"),
    patient_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Appointment).join(Patient).filter(
        Patient.hospital_id == current_user.hospital_id
    )

    if status and status != "all":
        query = query.filter(Appointment.status == status)

    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)

    appointments = query.order_by(Appointment.scheduled_at.asc()).all()

    results = []
    for ap in appointments:
        patient = ap.patient
        doctor = db.query(User).filter(User.id == ap.doctor_id).first() if ap.doctor_id else None

        results.append({
            "id": ap.id,
            "patient_id": ap.patient_id,
            "patient_name": patient.full_name if patient else "Unknown",
            "patient_phone": patient.phone if patient else "",
            "patient_mrn": patient.mrn if patient else "",
            "care_plan_id": ap.care_plan_id,
            "doctor_id": ap.doctor_id,
            "doctor_name": doctor.full_name if doctor else "Clinic Staff",
            "scheduled_at": ap.scheduled_at.isoformat() if ap.scheduled_at else None,
            "appointment_type": ap.appointment_type,
            "status": ap.status,
            "notes": ap.notes,
            "created_at": ap.created_at.isoformat() if ap.created_at else None
        })

    return results

@router.post("", response_model=dict)
def create_appointment(
    appt_in: AppointmentCreate,
    request: Request,
    current_user: User = Depends(require_roles(["admin", "doctor", "nurse"])),
    db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(
        Patient.id == appt_in.patient_id,
        Patient.hospital_id == current_user.hospital_id
    ).first()

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    new_appt = Appointment(
        patient_id=appt_in.patient_id,
        care_plan_id=appt_in.care_plan_id,
        doctor_id=current_user.id if current_user.role == "doctor" else None,
        scheduled_at=appt_in.scheduled_at,
        appointment_type=appt_in.appointment_type,
        status="scheduled",
        notes=appt_in.notes
    )
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)

    client_ip = request.client.host if request.client else "unknown"
    log_audit_event(
        db=db,
        action="SCHEDULE_APPOINTMENT",
        resource_type="appointment",
        resource_id=new_appt.id,
        user_id=current_user.id,
        details=f"Scheduled {new_appt.appointment_type} for patient {patient.full_name} at {new_appt.scheduled_at}",
        ip_address=client_ip
    )

    return {
        "id": new_appt.id,
        "patient_id": new_appt.patient_id,
        "patient_name": patient.full_name,
        "scheduled_at": new_appt.scheduled_at.isoformat(),
        "appointment_type": new_appt.appointment_type,
        "status": new_appt.status,
        "notes": new_appt.notes
    }

@router.patch("/{appointment_id}", response_model=dict)
def update_appointment(
    appointment_id: str,
    appt_update: AppointmentUpdate,
    request: Request,
    current_user: User = Depends(require_roles(["admin", "doctor", "nurse"])),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).join(Patient).filter(
        Appointment.id == appointment_id,
        Patient.hospital_id == current_user.hospital_id
    ).first()

    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appt_update.scheduled_at is not None:
        appt.scheduled_at = appt_update.scheduled_at
    if appt_update.status is not None:
        appt.status = appt_update.status
    if appt_update.appointment_type is not None:
        appt.appointment_type = appt_update.appointment_type
    if appt_update.notes is not None:
        appt.notes = appt_update.notes

    db.commit()
    db.refresh(appt)

    client_ip = request.client.host if request.client else "unknown"
    log_audit_event(
        db=db,
        action="UPDATE_APPOINTMENT",
        resource_type="appointment",
        resource_id=appt.id,
        user_id=current_user.id,
        details=f"Updated appointment {appt.id}: status={appt.status}",
        ip_address=client_ip
    )

    return {
        "id": appt.id,
        "patient_id": appt.patient_id,
        "scheduled_at": appt.scheduled_at.isoformat() if appt.scheduled_at else None,
        "appointment_type": appt.appointment_type,
        "status": appt.status,
        "notes": appt.notes
    }

@router.post("/{appointment_id}/remind")
def send_appointment_reminder(
    appointment_id: str,
    request: Request,
    current_user: User = Depends(require_roles(["admin", "doctor", "nurse"])),
    db: Session = Depends(get_db)
):
    appt = db.query(Appointment).join(Patient).filter(
        Appointment.id == appointment_id,
        Patient.hospital_id == current_user.hospital_id
    ).first()

    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    patient = appt.patient
    formatted_date = appt.scheduled_at.strftime("%A, %B %d at %I:%M %p")
    msg = (
        f"Hi {patient.full_name}, this is a reminder from AfterCare for your upcoming {appt.appointment_type} "
        f"on {formatted_date}. Please contact the clinic if you need to reschedule."
    )

    notif = Notification(
        patient_id=patient.id,
        care_plan_id=appt.care_plan_id,
        notification_type="appointment_reminder",
        channel="whatsapp",
        recipient_contact=patient.phone,
        message=msg,
        status="simulated",
        scheduled_for=datetime.now(timezone.utc),
        sent_at=datetime.now(timezone.utc)
    )
    db.add(notif)
    db.commit()

    client_ip = request.client.host if request.client else "unknown"
    log_audit_event(
        db=db,
        action="SEND_APPOINTMENT_REMINDER",
        resource_type="appointment",
        resource_id=appt.id,
        user_id=current_user.id,
        details=f"Simulated WhatsApp appointment reminder sent to {patient.full_name} ({patient.phone})",
        ip_address=client_ip
    )

    return {
        "success": True,
        "notification_id": notif.id,
        "channel": notif.channel,
        "recipient": notif.recipient_contact,
        "message": notif.message,
        "sent_at": notif.sent_at.isoformat()
    }

