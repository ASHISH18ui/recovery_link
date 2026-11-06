from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str
    department: Optional[str] = "Orthopedics"
    is_active: bool = True

class UserCreate(UserBase):
    hospital_id: str
    password: str

class UserOut(UserBase):
    id: str
    hospital_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Hospital
class HospitalOut(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Medication
class MedicationCreate(BaseModel):
    name: str
    dosage: str
    frequency: str
    purpose: Optional[str] = None

class MedicationOut(MedicationCreate):
    id: str
    care_plan_id: str
    is_active: bool

    class Config:
        from_attributes = True

# Checkin
class CheckinCreate(BaseModel):
    pain_level: int = Field(ge=0, le=10)
    has_fever: bool = False
    temperature: Optional[float] = None
    has_swelling: bool = False
    swelling_details: Optional[str] = None
    eating_normally: bool = True
    sleeping_normally: bool = True
    moving_normally: bool = True
    medication_taken: bool = True
    missed_medication_reason: Optional[str] = None
    new_symptoms: Optional[str] = None
    callback_requested: bool = False
    callback_reason: Optional[str] = None

class CheckinOut(BaseModel):
    id: str
    patient_id: str
    care_plan_id: str
    date: str
    submitted_at: datetime
    pain_level: int
    has_fever: bool
    temperature: Optional[float] = None
    has_swelling: bool
    swelling_details: Optional[str] = None
    eating_normally: bool
    sleeping_normally: bool
    moving_normally: bool
    medication_taken: bool
    missed_medication_reason: Optional[str] = None
    new_symptoms: Optional[str] = None
    callback_requested: bool
    callback_reason: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_risk_level: str
    ai_flags: List[str] = []
    ai_missing_info: List[str] = []

    class Config:
        from_attributes = True

# Alert
class AlertActionRequest(BaseModel):
    action: str  # call_patient, schedule_visit, escalate_to_doctor, no_action_needed
    notes: Optional[str] = None

class AlertOut(BaseModel):
    id: str
    patient_id: str
    patient_name: Optional[str] = None
    patient_phone: Optional[str] = None
    checkin_id: Optional[str] = None
    care_plan_id: str
    risk_level: str
    summary: str
    flags: List[str] = []
    status: str
    acknowledged_by: Optional[str] = None
    acknowledged_by_name: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    action_taken: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Appointment
class AppointmentCreate(BaseModel):
    patient_id: str
    care_plan_id: str
    scheduled_at: datetime
    appointment_type: str = "Post-op Clinic Follow-up"
    notes: Optional[str] = None

class AppointmentOut(BaseModel):
    id: str
    patient_id: str
    care_plan_id: str
    doctor_id: Optional[str] = None
    scheduled_at: datetime
    appointment_type: str
    status: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True

# Care Plan
class CarePlanOut(BaseModel):
    id: str
    discharge_id: str
    patient_id: str
    start_date: datetime
    end_date: Optional[datetime] = None
    follow_up_date: Optional[datetime] = None
    status: str
    medications: List[MedicationOut] = []

    class Config:
        from_attributes = True

# Discharge
class DischargeCreate(BaseModel):
    full_name: str
    phone: str
    email: Optional[EmailStr] = None
    date_of_birth: str
    gender: Optional[str] = "Other"
    emergency_contact: Optional[str] = None
    mrn: Optional[str] = None
    
    # Admission info
    diagnosis: str
    surgical_procedure: Optional[str] = None
    treating_doctor_id: str
    admitted_at: Optional[datetime] = None
    discharged_at: Optional[datetime] = None
    
    # Discharge & care plan
    discharge_instructions: str
    follow_up_date: Optional[datetime] = None
    medications: List[MedicationCreate] = []

class DischargeOut(BaseModel):
    discharge_id: str
    admission_id: str
    patient_id: str
    patient_name: str
    patient_token: str
    patient_link: str
    simulated_message: str
    created_at: datetime

# Patient Out
class PatientOut(BaseModel):
    id: str
    mrn: Optional[str] = None
    full_name: str
    phone: str
    email: Optional[str] = None
    date_of_birth: str
    gender: str
    access_token: str
    token_expires_at: Optional[datetime] = None
    latest_checkin_date: Optional[str] = None
    status: Optional[str] = "active"
    current_risk_level: Optional[str] = "low"
    pending_alerts_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class PatientDetailOut(BaseModel):
    id: str
    mrn: Optional[str] = None
    full_name: str
    phone: str
    email: Optional[str] = None
    date_of_birth: str
    gender: str
    access_token: str
    patient_link: str
    current_care_plan: Optional[CarePlanOut] = None
    diagnosis: Optional[str] = None
    surgical_procedure: Optional[str] = None
    discharge_instructions: Optional[str] = None
    checkins: List[CheckinOut] = []
    alerts: List[AlertOut] = []
    appointments: List[AppointmentOut] = []
    created_at: datetime

# Dashboard Stats
class DashboardStatsOut(BaseModel):
    total_discharged_patients: int
    completed_today: int
    missed_checkins: int
    requiring_review: int
    upcoming_appointments: int

# Notification
class NotificationOut(BaseModel):
    id: str
    patient_id: Optional[str] = None
    patient_name: Optional[str] = None
    notification_type: str
    channel: str
    recipient_contact: str
    message: str
    status: str
    link_url: Optional[str] = None
    sent_at: datetime

    class Config:
        from_attributes = True

# Audit Log
class AuditLogOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Patient Notes
class PatientNoteCreate(BaseModel):
    content: str
    note_type: Optional[str] = "clinical"

class PatientNoteOut(BaseModel):
    id: str
    patient_id: str
    author_id: str
    author_name: Optional[str] = None
    author_role: Optional[str] = None
    note_type: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

# Care Plan Template
class CarePlanTemplateCreate(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    duration_days: int = 14
    checkin_frequency: Optional[str] = "daily"
    default_instructions: Optional[str] = None
    suggested_medications: Optional[str] = "[]"

class CarePlanTemplateOut(CarePlanTemplateCreate):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Hospital Update
class HospitalUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None

# Alert Assign
class AlertAssignRequest(BaseModel):
    assignee_id: str
    notes: Optional[str] = None

# Appointment Update
class AppointmentUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    appointment_type: Optional[str] = None

Token.model_rebuild()

