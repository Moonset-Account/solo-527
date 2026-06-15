from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.schemas import DepositResponse, DepositCreate, DepositUpdate
from app.services.auth import get_current_user, RoleChecker
from app.services.deposit_service import (
    get_deposit,
    get_deposits,
    count_deposits,
    create_deposit,
    update_deposit,
    refund_deposit,
    get_total_deposit_amount
)
from app.models import User

router = APIRouter(prefix="/deposits", tags=["押金记录"])


@router.get("/", response_model=List[DepositResponse])
def list_deposits(
    request: Request,
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    apartment_id: Optional[int] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "customer_service", "consultant"]))
):
    deposits = get_deposits(
        db, skip=skip, limit=limit,
        status=status, apartment_id=apartment_id,
        keyword=keyword
    )
    return deposits


@router.get("/stats")
def deposit_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_amount = get_total_deposit_amount(db)
    paid_count = count_deposits(db, status="paid")
    refunded_count = count_deposits(db, status="refunded")
    return {
        "total_amount": total_amount,
        "paid_count": paid_count,
        "refunded_count": refunded_count
    }


@router.get("/{deposit_id}", response_model=DepositResponse)
def get_deposit_detail(
    deposit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "customer_service", "consultant"]))
):
    deposit = get_deposit(db, deposit_id)
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    return deposit


@router.post("/", response_model=DepositResponse)
def create_new_deposit(
    deposit: DepositCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "customer_service"]))
):
    return create_deposit(db, deposit, current_user.id)


@router.put("/{deposit_id}", response_model=DepositResponse)
def update_existing_deposit(
    deposit_id: int,
    deposit_update: DepositUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "customer_service"]))
):
    deposit = update_deposit(db, deposit_id, deposit_update, current_user.id)
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    return deposit


@router.post("/{deposit_id}/refund")
def refund_deposit_by_id(
    deposit_id: int,
    refund_amount: float,
    remark: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(RoleChecker(["admin", "customer_service"]))
):
    deposit = refund_deposit(db, deposit_id, refund_amount, remark, current_user.id)
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit not found")
    return {"message": "Deposit refunded successfully", "refund_amount": refund_amount}
