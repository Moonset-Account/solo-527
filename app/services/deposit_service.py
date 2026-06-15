from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import Deposit
from app.schemas import DepositCreate, DepositUpdate


def get_deposit(db: Session, deposit_id: int) -> Optional[Deposit]:
    return db.query(Deposit).filter(Deposit.id == deposit_id).first()


def get_deposits(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    apartment_id: Optional[int] = None,
    keyword: Optional[str] = None,
) -> List[Deposit]:
    query = db.query(Deposit)

    if status:
        query = query.filter(Deposit.status == status)
    if apartment_id:
        query = query.filter(Deposit.apartment_id == apartment_id)
    if keyword:
        query = query.filter(
            (Deposit.tenant_name.contains(keyword)) |
            (Deposit.tenant_phone.contains(keyword)) |
            (Deposit.contract_no.contains(keyword))
        )

    return query.order_by(Deposit.created_at.desc()).offset(skip).limit(limit).all()


def count_deposits(
    db: Session,
    status: Optional[str] = None,
) -> int:
    query = db.query(func.count(Deposit.id))
    if status:
        query = query.filter(Deposit.status == status)
    return query.scalar()


def create_deposit(db: Session, deposit: DepositCreate, operator_id: int = None) -> Deposit:
    db_deposit = Deposit(**deposit.model_dump())
    db.add(db_deposit)
    db.commit()
    db.refresh(db_deposit)
    return db_deposit


def update_deposit(
    db: Session,
    deposit_id: int,
    deposit_update: DepositUpdate,
    operator_id: int = None
) -> Optional[Deposit]:
    db_deposit = get_deposit(db, deposit_id)
    if not db_deposit:
        return None

    update_data = deposit_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_deposit, field, value)

    db.commit()
    db.refresh(db_deposit)
    return db_deposit


def refund_deposit(
    db: Session,
    deposit_id: int,
    refund_amount: float,
    remark: str = None,
    operator_id: int = None
) -> Optional[Deposit]:
    db_deposit = get_deposit(db, deposit_id)
    if not db_deposit:
        return None

    from datetime import date
    db_deposit.status = "refunded" if refund_amount >= db_deposit.amount else "partial_refunded"
    db_deposit.refund_amount = refund_amount
    db_deposit.refund_date = date.today()
    if remark:
        db_deposit.remark = remark

    db.commit()
    db.refresh(db_deposit)
    return db_deposit


def get_total_deposit_amount(db: Session, status: Optional[str] = None) -> float:
    query = db.query(func.sum(Deposit.amount))
    if status:
        query = query.filter(Deposit.status == status)
    result = query.scalar()
    return result or 0
