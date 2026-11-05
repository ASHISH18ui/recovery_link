from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db import get_db
from app.models.models import AuditLog, User
from app.schemas.schemas import AuditLogOut
from app.core.deps import get_current_user

router = APIRouter(prefix="/audit-logs", tags=["audit"])

@router.get("", response_model=List[AuditLogOut])
def list_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit).all()
    results = []
    for l in logs:
        results.append(AuditLogOut(
            id=l.id,
            user_id=l.user_id,
            user_name=l.user.full_name if l.user else "Patient / System",
            action=l.action,
            resource_type=l.resource_type,
            resource_id=l.resource_id,
            details=l.details,
            ip_address=l.ip_address,
            created_at=l.created_at
        ))
    return results

