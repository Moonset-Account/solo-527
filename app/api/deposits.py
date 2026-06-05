from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database import get_db
from app.core.security import get_current_user
from app.core.permissions import PermissionRequired
from app.models import User, Deposit, DepositStatus, Vendor
from app.schemas.deposit import DepositCreate, DepositResponse, DepositUpdate

router = APIRouter(prefix="/deposits", tags=["保证金管理"])


@router.get("/", response_model=List[DepositResponse], dependencies=[Depends(PermissionRequired("manage_deposits"))])
def list_deposits(
    status: DepositStatus = None,
    vendor_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Deposit)
    if status:
        query = query.filter(Deposit.status == status)
    if vendor_id:
        query = query.filter(Deposit.vendor_id == vendor_id)
    return query.order_by(Deposit.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=DepositResponse, dependencies=[Depends(PermissionRequired("manage_deposits"))])
def create_deposit(
    deposit_in: DepositCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    vendor = db.query(Vendor).filter(Vendor.id == deposit_in.vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="摊主不存在")
    deposit = Deposit(**deposit_in.model_dump())
    db.add(deposit)
    db.commit()
    db.refresh(deposit)
    return deposit


@router.put("/{deposit_id}", response_model=DepositResponse, dependencies=[Depends(PermissionRequired("manage_deposits"))])
def update_deposit(
    deposit_id: int,
    deposit_in: DepositUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deposit = db.query(Deposit).filter(Deposit.id == deposit_id).first()
    if not deposit:
        raise HTTPException(status_code=404, detail="保证金记录不存在")
    
    update_data = deposit_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(deposit, field, value)
    
    if deposit_in.status == DepositStatus.PAID and not deposit.paid_at:
        deposit.paid_at = datetime.utcnow()
    if deposit_in.status == DepositStatus.REFUNDED and not deposit.refunded_at:
        deposit.refunded_at = datetime.utcnow()
    
    db.commit()
    db.refresh(deposit)
    return deposit


@router.put("/{deposit_id}/review", response_model=DepositResponse, dependencies=[Depends(PermissionRequired("manage_deposits"))])
def review_deposit(
    deposit_id: int,
    status: DepositStatus,
    review_notes: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deposit = db.query(Deposit).filter(Deposit.id == deposit_id).first()
    if not deposit:
        raise HTTPException(status_code=404, detail="保证金记录不存在")
    deposit.status = status
    deposit.review_notes = review_notes
    deposit.reviewed_by = current_user.id
    deposit.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(deposit)
    return deposit
