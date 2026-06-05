from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.core.security import get_current_user
from app.core.permissions import PermissionRequired
from app.models import User, ViolationNote, ViolationStatus
from app.schemas.violation import ViolationCreate, ViolationResponse, ViolationUpdate

router = APIRouter(prefix="/violations", tags=["违规管理"])


@router.get("/", response_model=List[ViolationResponse], dependencies=[Depends(PermissionRequired("manage_violations"))])
def list_violations(
    status: ViolationStatus = None,
    vendor_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ViolationNote)
    if status:
        query = query.filter(ViolationNote.status == status)
    if vendor_id:
        query = query.filter(ViolationNote.vendor_id == vendor_id)
    return query.order_by(ViolationNote.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=ViolationResponse, dependencies=[Depends(PermissionRequired("manage_violations"))])
def create_violation(
    violation_in: ViolationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    violation = ViolationNote(**violation_in.model_dump())
    violation.reported_by = current_user.id
    db.add(violation)
    db.commit()
    db.refresh(violation)
    return violation


@router.put("/{violation_id}", response_model=ViolationResponse, dependencies=[Depends(PermissionRequired("manage_violations"))])
def update_violation(
    violation_id: int,
    violation_in: ViolationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    violation = db.query(ViolationNote).filter(ViolationNote.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="违规记录不存在")
    
    update_data = violation_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(violation, field, value)
    
    if violation_in.status == ViolationStatus.RESOLVED and not violation.resolved_at:
        violation.resolved_at = datetime.utcnow()
        violation.resolved_by = current_user.id
    
    db.commit()
    db.refresh(violation)
    return violation
