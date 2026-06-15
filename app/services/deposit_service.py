from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models import Deposit
from app.schemas import DepositCreate, DepositUpdate
from app.services.common import _add_change_log, update_entity_remark, get_change_logs, get_attachments


def get_deposit(db: Session, deposit_id: int) -> Optional[Deposit]:
    return (
        db.query(Deposit)
        .options(joinedload(Deposit.apartment))
        .filter(Deposit.id == deposit_id)
        .first()
    )


def get_deposits(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    apartment_id: Optional[int] = None,
    keyword: Optional[str] = None,
) -> List[Deposit]:
    query = db.query(Deposit).options(joinedload(Deposit.apartment))

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
    db.flush()
    _add_change_log(db, "deposits", db_deposit.id, None, None, None, "create", operator_id, "创建押金记录")
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
        old = getattr(db_deposit, field, None)
        if old != value:
            _add_change_log(db, "deposits", deposit_id, field, old, value, "update", operator_id)
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
    old_status = db_deposit.status
    new_status = "refunded" if refund_amount >= db_deposit.amount else "partial_refunded"
    db_deposit.status = new_status
    db_deposit.refund_amount = refund_amount
    db_deposit.refund_date = date.today()
    if remark:
        db_deposit.remark = remark

    _add_change_log(db, "deposits", deposit_id, "status", old_status, new_status, "update", operator_id, f"退款: {refund_amount}")
    db.commit()
    db.refresh(db_deposit)
    return db_deposit


def update_deposit_remark(db: Session, deposit_id: int, remark: str, operator_id: int = None) -> Optional[Deposit]:
    deposit = get_deposit(db, deposit_id)
    if not deposit:
        return None
    update_entity_remark(db, deposit, "deposits", remark, operator_id)
    return deposit


def get_deposit_change_logs(db: Session, deposit_id: int):
    return get_change_logs(db, "deposits", deposit_id)


def get_deposit_attachments(db: Session, deposit_id: int):
    return get_attachments(db, "deposit", deposit_id)


def get_total_deposit_amount(db: Session, status: Optional[str] = None) -> float:
    query = db.query(func.sum(Deposit.amount))
    if status:
        query = query.filter(Deposit.status == status)
    result = query.scalar()
    return result or 0
