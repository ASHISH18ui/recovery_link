from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db import get_db
from app.models.models import Notification, Patient, User, CarePlan
from app.schemas.schemas import NotificationOut
from app.core.deps import get_current_user
from app.services.notification_service import notification_service
from app.core.config import settings

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=List[NotificationOut])
def list_notifications(
    patient_id: Optional[str] = Query(None),
    notification_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Notification).order_by(desc(Notification.sent_at))
    
    if patient_id:
        query = query.filter(Notification.patient_id == patient_id)
        
    if notification_type:
        query = query.filter(Notification.notification_type == notification_type)

    notifs = query.limit(limit).all()
    
    results = []
    for n in notifs:
        results.append(NotificationOut(
            id=n.id,
            patient_id=n.patient_id,
            patient_name=n.patient.full_name if n.patient else None,
            notification_type=n.notification_type,
            channel=n.channel,
            recipient_contact=n.recipient_contact,
            message=n.message,
            status=n.status,
            link_url=n.link_url,
            sent_at=n.sent_at
        ))
    return results

@router.post("/send-checkin-reminder/{patient_id}")
def trigger_checkin_reminder(
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

    care_plan = db.query(CarePlan).filter(
        CarePlan.patient_id == patient.id,
        CarePlan.status == "active"
    ).first()

    notif = notification_service.send_daily_checkin_reminder(
        db=db,
        patient=patient,
        care_plan=care_plan,
        portal_url=settings.PATIENT_PORTAL_URL
    )

    return {
        "success": True,
        "message": f"Simulated check-in reminder queued for {patient.full_name}",
        "notification_id": notif.id,
        "content": notif.message
    }

