import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.models import Hospital, User, CarePlanTemplate
from app.schemas.schemas import (
    HospitalOut, HospitalUpdate, CarePlanTemplateCreate, CarePlanTemplateOut,
    UserCreate, UserOut
)
from app.core.deps import get_current_user, require_roles, log_audit_event
from app.core.security import get_password_hash

router = APIRouter(prefix="/settings", tags=["settings"])

@router.get("/hospital", response_model=HospitalOut)
def get_hospital_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    hospital = db.query(Hospital).filter(Hospital.id == current_user.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital

@router.patch("/hospital", response_model=HospitalOut)
def update_hospital_profile(
    h_update: HospitalUpdate,
    request: Request,
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db)
):
    hospital = db.query(Hospital).filter(Hospital.id == current_user.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    if h_update.name is not None:
        hospital.name = h_update.name
    if h_update.address is not None:
        hospital.address = h_update.address
    if h_update.phone is not None:
        hospital.phone = h_update.phone

    db.commit()
    db.refresh(hospital)

    client_ip = request.client.host if request.client else "unknown"
    log_audit_event(
        db=db,
        action="UPDATE_HOSPITAL_PROFILE",
        resource_type="hospital",
        resource_id=hospital.id,
        user_id=current_user.id,
        details=f"Updated hospital profile: {hospital.name}",
        ip_address=client_ip
    )

    return hospital

@router.get("/templates", response_model=List[CarePlanTemplateOut])
def get_care_plan_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    templates = db.query(CarePlanTemplate).order_by(CarePlanTemplate.name.asc()).all()
    return templates

@router.post("/templates", response_model=CarePlanTemplateOut)
def create_care_plan_template(
    t_in: CarePlanTemplateCreate,
    request: Request,
    current_user: User = Depends(require_roles(["admin", "doctor"])),
    db: Session = Depends(get_db)
):
    tmpl = CarePlanTemplate(
        name=t_in.name,
        category=t_in.category,
        description=t_in.description,
        duration_days=t_in.duration_days,
        checkin_frequency=t_in.checkin_frequency,
        default_instructions=t_in.default_instructions,
        suggested_medications=t_in.suggested_medications
    )
    db.add(tmpl)
    db.commit()
    db.refresh(tmpl)

    client_ip = request.client.host if request.client else "unknown"
    log_audit_event(
        db=db,
        action="CREATE_TEMPLATE",
        resource_type="template",
        resource_id=tmpl.id,
        user_id=current_user.id,
        details=f"Created care-plan template {tmpl.name}",
        ip_address=client_ip
    )

    return tmpl

@router.get("/team", response_model=List[UserOut])
def get_team_members(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    team = db.query(User).filter(
        User.hospital_id == current_user.hospital_id
    ).order_by(User.role.asc(), User.full_name.asc()).all()
    return team

@router.post("/team", response_model=UserOut)
def add_team_member(
    user_in: UserCreate,
    request: Request,
    current_user: User = Depends(require_roles(["admin"])),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = User(
        hospital_id=current_user.hospital_id,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        full_name=user_in.full_name,
        department=user_in.department,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    client_ip = request.client.host if request.client else "unknown"
    log_audit_event(
        db=db,
        action="CREATE_TEAM_MEMBER",
        resource_type="user",
        resource_id=new_user.id,
        user_id=current_user.id,
        details=f"Added {new_user.role} member {new_user.full_name} ({new_user.email})",
        ip_address=client_ip
    )

    return new_user

