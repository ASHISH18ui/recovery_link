import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Float, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from app.db import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    address = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    users = relationship("User", back_populates="hospital")
    patients = relationship("Patient", back_populates="hospital")

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    hospital_id = Column(String(36), ForeignKey("hospitals.id"), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # admin, doctor, nurse
    full_name = Column(String(255), nullable=False)
    department = Column(String(100), default="Orthopedics")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    hospital = relationship("Hospital", back_populates="users")
    admissions_treated = relationship("Admission", back_populates="treating_doctor", foreign_keys="Admission.treating_doctor_id")
    discharges_performed = relationship("DischargeRecord", back_populates="discharged_by_user", foreign_keys="DischargeRecord.discharged_by")
    alerts_reviewed = relationship("Alert", back_populates="reviewer", foreign_keys="Alert.acknowledged_by")
    audit_logs = relationship("AuditLog", back_populates="user")
    patient_notes = relationship("PatientNote", back_populates="author")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    hospital_id = Column(String(36), ForeignKey("hospitals.id"), nullable=False)
    mrn = Column(String(50), nullable=True, index=True) # Medical Record Number
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    email = Column(String(255), nullable=True)
    date_of_birth = Column(String(20), nullable=False)
    gender = Column(String(20), default="Other")
    emergency_contact = Column(String(255), nullable=True)
    access_token = Column(String(100), unique=True, index=True, nullable=False)
    token_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    hospital = relationship("Hospital", back_populates="patients")
    admissions = relationship("Admission", back_populates="patient", cascade="all, delete-orphan")
    care_plans = relationship("CarePlan", back_populates="patient", cascade="all, delete-orphan")
    checkins = relationship("Checkin", back_populates="patient", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="patient", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="patient", cascade="all, delete-orphan")
    notes = relationship("PatientNote", back_populates="patient", cascade="all, delete-orphan")

class Admission(Base):
    __tablename__ = "admissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    admitted_at = Column(DateTime, default=utc_now)
    diagnosis = Column(String(255), nullable=False)
    treating_doctor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="discharged")  # admitted, discharged
    created_at = Column(DateTime, default=utc_now)

    patient = relationship("Patient", back_populates="admissions")
    treating_doctor = relationship("User", back_populates="admissions_treated", foreign_keys=[treating_doctor_id])
    discharge_record = relationship("DischargeRecord", back_populates="admission", uselist=False, cascade="all, delete-orphan")

class DischargeRecord(Base):
    __tablename__ = "discharge_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    admission_id = Column(String(36), ForeignKey("admissions.id"), nullable=False, unique=True)
    discharged_at = Column(DateTime, default=utc_now)
    surgical_procedure = Column(String(255), nullable=True)
    discharge_instructions = Column(Text, nullable=False)
    discharged_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=utc_now)

    admission = relationship("Admission", back_populates="discharge_record")
    discharged_by_user = relationship("User", back_populates="discharges_performed", foreign_keys=[discharged_by])
    care_plan = relationship("CarePlan", back_populates="discharge_record", uselist=False, cascade="all, delete-orphan")

class CarePlan(Base):
    __tablename__ = "care_plans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    discharge_id = Column(String(36), ForeignKey("discharge_records.id"), nullable=False, unique=True)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    start_date = Column(DateTime, default=utc_now)
    end_date = Column(DateTime, nullable=True)
    follow_up_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="active")  # active, completed, cancelled
    daily_checkin_due_time = Column(String(20), default="09:00")
    created_at = Column(DateTime, default=utc_now)

    discharge_record = relationship("DischargeRecord", back_populates="care_plan")
    patient = relationship("Patient", back_populates="care_plans")
    medications = relationship("Medication", back_populates="care_plan", cascade="all, delete-orphan")
    checkins = relationship("Checkin", back_populates="care_plan", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="care_plan", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="care_plan", cascade="all, delete-orphan")

class Medication(Base):
    __tablename__ = "medications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    care_plan_id = Column(String(36), ForeignKey("care_plans.id"), nullable=False)
    name = Column(String(255), nullable=False)
    dosage = Column(String(100), nullable=False)
    frequency = Column(String(100), nullable=False)  # e.g. "Once daily morning"
    purpose = Column(String(255), nullable=True)     # e.g. "Pain relief", "DVT prevention"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    care_plan = relationship("CarePlan", back_populates="medications")

class Checkin(Base):
    __tablename__ = "checkins"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    care_plan_id = Column(String(36), ForeignKey("care_plans.id"), nullable=False)
    date = Column(String(20), nullable=False)  # YYYY-MM-DD
    submitted_at = Column(DateTime, default=utc_now)
    
    pain_level = Column(Integer, nullable=False)  # 0 to 10
    has_fever = Column(Boolean, default=False)
    temperature = Column(Float, nullable=True)
    has_swelling = Column(Boolean, default=False)
    swelling_details = Column(String(255), nullable=True)
    
    eating_normally = Column(Boolean, default=True)
    sleeping_normally = Column(Boolean, default=True)
    moving_normally = Column(Boolean, default=True)
    
    medication_taken = Column(Boolean, default=True)
    missed_medication_reason = Column(String(255), nullable=True)
    
    new_symptoms = Column(Text, nullable=True)
    callback_requested = Column(Boolean, default=False)
    callback_reason = Column(String(255), nullable=True)
    
    # AI Analysis
    ai_summary = Column(Text, nullable=True)
    ai_risk_level = Column(String(20), default="low")  # low, medium, high
    ai_flags = Column(Text, default="[]")              # JSON serialized string list
    ai_missing_info = Column(Text, default="[]")       # JSON serialized string list

    patient = relationship("Patient", back_populates="checkins")
    care_plan = relationship("CarePlan", back_populates="checkins")
    vitals = relationship("Vital", back_populates="checkin", cascade="all, delete-orphan")
    alert = relationship("Alert", back_populates="checkin", uselist=False)

class Vital(Base):
    __tablename__ = "vitals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    checkin_id = Column(String(36), ForeignKey("checkins.id"), nullable=True)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    vital_type = Column(String(50), nullable=False)  # temperature, blood_pressure, heart_rate, oxygen_sat
    value = Column(String(50), nullable=False)
    unit = Column(String(20), nullable=False)
    recorded_at = Column(DateTime, default=utc_now)

    checkin = relationship("Checkin", back_populates="vitals")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    checkin_id = Column(String(36), ForeignKey("checkins.id"), nullable=True)
    care_plan_id = Column(String(36), ForeignKey("care_plans.id"), nullable=False)
    
    risk_level = Column(String(20), nullable=False)  # medium, high
    summary = Column(Text, nullable=False)
    flags = Column(Text, default="[]")               # JSON serialized string list
    status = Column(String(50), default="pending")   # pending, acknowledged, resolved
    
    acknowledged_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    action_taken = Column(String(100), nullable=True) # call_patient, schedule_visit, escalate_to_doctor, no_action_needed
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    patient = relationship("Patient", back_populates="alerts")
    checkin = relationship("Checkin", back_populates="alert")
    reviewer = relationship("User", back_populates="alerts_reviewed", foreign_keys=[acknowledged_by])

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    care_plan_id = Column(String(36), ForeignKey("care_plans.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    scheduled_at = Column(DateTime, nullable=False)
    appointment_type = Column(String(100), default="Post-op Clinic Follow-up")
    status = Column(String(50), default="scheduled")  # scheduled, completed, cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    patient = relationship("Patient", back_populates="appointments")
    care_plan = relationship("CarePlan", back_populates="appointments")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    care_plan_id = Column(String(36), ForeignKey("care_plans.id"), nullable=True)
    
    notification_type = Column(String(50), nullable=False)  # onboarding_link, medication_reminder, checkin_reminder, appointment_reminder, staff_escalation
    channel = Column(String(50), default="sms")             # sms, whatsapp, in_app
    recipient_contact = Column(String(100), nullable=False) # phone or email
    message = Column(Text, nullable=False)
    status = Column(String(50), default="simulated")        # simulated, sent, failed
    link_url = Column(String(500), nullable=True)
    scheduled_for = Column(DateTime, default=utc_now)
    sent_at = Column(DateTime, default=utc_now)

    patient = relationship("Patient", back_populates="notifications")
    care_plan = relationship("CarePlan", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)      # VIEW_PATIENT, ACKNOWLEDGE_ALERT, CREATE_DISCHARGE, SUBMIT_CHECKIN, LOGIN
    resource_type = Column(String(50), nullable=False) # patient, alert, discharge, checkin
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    user = relationship("User", back_populates="audit_logs")

class PatientNote(Base):
    __tablename__ = "patient_notes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    author_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    note_type = Column(String(50), default="clinical") # clinical, phone_call, follow_up, general
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    patient = relationship("Patient", back_populates="notes")
    author = relationship("User", back_populates="patient_notes")

class CarePlanTemplate(Base):
    __tablename__ = "care_plan_templates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False) # Orthopedics, Cardiology, Obstetrics, Spine, General Surgery
    description = Column(Text, nullable=True)
    duration_days = Column(Integer, default=14)
    checkin_frequency = Column(String(50), default="daily")
    default_instructions = Column(Text, nullable=True)
    suggested_medications = Column(Text, default="[]") # JSON list of {name, dosage, frequency, purpose}
    created_at = Column(DateTime, default=utc_now)

