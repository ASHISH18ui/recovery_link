import logging
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.models.models import Notification, Patient, CarePlan, User

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def send_notification(
        db: Session,
        notification_type: str,
        recipient_contact: str,
        message: str,
        patient_id: Optional[str] = None,
        user_id: Optional[str] = None,
        care_plan_id: Optional[str] = None,
        channel: str = "sms",
        link_url: Optional[str] = None
    ) -> Notification:
        # Abstract provider: stores in DB with status="simulated" and logs to system log
        logger.info(f"[{channel.upper()} to {recipient_contact}]: {message}")
        
        notification = Notification(
            patient_id=patient_id,
            user_id=user_id,
            care_plan_id=care_plan_id,
            notification_type=notification_type,
            channel=channel,
            recipient_contact=recipient_contact,
            message=message,
            status="simulated",
            link_url=link_url,
            sent_at=datetime.now(timezone.utc)
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def send_patient_onboarding(
        db: Session,
        patient: Patient,
        care_plan: CarePlan,
        portal_url: str
    ) -> Notification:
        patient_link = f"{portal_url}/{patient.access_token}"
        msg = (
            f"Hello {patient.full_name}, your post-discharge recovery monitoring from AfterCare is active. "
            f"Please tap this secure link to complete your daily check-in: {patient_link}"
        )
        return NotificationService.send_notification(
            db=db,
            notification_type="onboarding_link",
            channel="whatsapp",
            recipient_contact=patient.phone,
            message=msg,
            patient_id=patient.id,
            care_plan_id=care_plan.id,
            link_url=patient_link
        )

    @staticmethod
    def send_daily_checkin_reminder(
        db: Session,
        patient: Patient,
        care_plan: CarePlan,
        portal_url: str
    ) -> Notification:
        patient_link = f"{portal_url}/{patient.access_token}"
        msg = (
            f"Good morning {patient.full_name}, it's time for your daily recovery check-in. "
            f"Let your surgical care team know how you are feeling: {patient_link}"
        )
        return NotificationService.send_notification(
            db=db,
            notification_type="checkin_reminder",
            channel="sms",
            recipient_contact=patient.phone,
            message=msg,
            patient_id=patient.id,
            care_plan_id=care_plan.id,
            link_url=patient_link
        )

    @staticmethod
    def send_medication_reminder(
        db: Session,
        patient: Patient,
        care_plan: CarePlan,
        medication_name: str,
        dosage: str,
        instructions: str
    ) -> Notification:
        msg = (
            f"AfterCare Reminder: Please remember to take {medication_name} ({dosage}) - {instructions}. "
            "Reply via your daily check-in portal once taken."
        )
        return NotificationService.send_notification(
            db=db,
            notification_type="medication_reminder",
            channel="sms",
            recipient_contact=patient.phone,
            message=msg,
            patient_id=patient.id,
            care_plan_id=care_plan.id
        )

    @staticmethod
    def send_staff_escalation(
        db: Session,
        staff_user: User,
        patient: Patient,
        alert_summary: str,
        risk_level: str
    ) -> Notification:
        msg = (
            f"[STAFF ESCALATION - {risk_level.upper()}] Patient {patient.full_name} has an unacknowledged alert: "
            f"'{alert_summary}'. Please review in AfterCare dashboard."
        )
        return NotificationService.send_notification(
            db=db,
            notification_type="staff_escalation",
            channel="in_app",
            recipient_contact=staff_user.email,
            message=msg,
            patient_id=patient.id,
            user_id=staff_user.id
        )

notification_service = NotificationService()

