from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.models import User, Hospital
from app.schemas.schemas import LoginRequest, Token, UserOut
from app.core.security import verify_password, create_access_token
from app.core.deps import get_current_user, log_audit_event
from typing import List

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
def login(request: Request, login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive account")

    access_token = create_access_token(
        subject=user.id,
        role=user.role,
        hospital_id=user.hospital_id
    )

    client_ip = request.client.host if request.client else "unknown"
    log_audit_event(
        db=db,
        action="LOGIN",
        resource_type="user",
        resource_id=user.id,
        user_id=user.id,
        details=f"Successful login for {user.email} ({user.role})",
        ip_address=client_ip
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/doctors", response_model=List[UserOut])
def list_doctors(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doctors = db.query(User).filter(
        User.hospital_id == current_user.hospital_id,
        User.role.in_(["doctor", "admin"])
    ).all()
    return doctors

