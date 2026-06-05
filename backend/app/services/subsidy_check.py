import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.elder import Elder
from app.models.subsidy import SubsidyRecord, SubsidyExceedConfirmation
from app.models.notification import Notification
from app.schemas.subsidy import SubsidyCheckResult


def check_subsidy_balance(
    db: Session, elder_id: uuid.UUID, order_amount: float
) -> SubsidyCheckResult:
    elder = db.query(Elder).filter(Elder.id == elder_id).first()
    if not elder:
        raise ValueError(f"Elder {elder_id} not found")

    current_balance = elder.subsidy_quota - elder.subsidy_used
    is_exceed = order_amount > current_balance

    return SubsidyCheckResult(
        elder_id=elder.id,
        current_balance=current_balance,
        order_amount=order_amount,
        is_exceed=is_exceed,
        need_confirmation=is_exceed,
    )


def deduct_subsidy(
    db: Session,
    elder_id: uuid.UUID,
    order_id: uuid.UUID,
    amount: float,
    force: bool = False,
) -> SubsidyRecord:
    elder = db.query(Elder).filter(Elder.id == elder_id).first()
    if not elder:
        raise ValueError(f"Elder {elder_id} not found")

    current_balance = elder.subsidy_quota - elder.subsidy_used
    is_exceed = amount > current_balance

    if is_exceed and not force:
        confirmation = SubsidyExceedConfirmation(
            elder_id=elder_id,
            subsidy_record_id=uuid.uuid4(),
            confirm_type="family",
            status="pending",
        )
        db.add(confirmation)

        _notify_subsidy_exceed(db, elder, amount, current_balance)
        db.commit()
        db.refresh(confirmation)
        raise PermissionError(
            f"Subsidy exceeded: need confirmation. Confirmation ID: {confirmation.id}"
        )

    balance_before = elder.subsidy_used
    elder.subsidy_used += amount
    balance_after = elder.subsidy_quota - elder.subsidy_used

    record = SubsidyRecord(
        elder_id=elder_id,
        order_id=order_id,
        amount=amount,
        balance_before=balance_before,
        balance_after=balance_after,
        is_exceed=is_exceed,
        confirmed=force,
        confirmed_by="system" if force else None,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def confirm_subsidy_exceed(
    db: Session,
    confirmation_id: uuid.UUID,
    confirmer_name: str,
    status: str,
    note: str | None = None,
) -> SubsidyExceedConfirmation:
    confirmation = (
        db.query(SubsidyExceedConfirmation)
        .filter(SubsidyExceedConfirmation.id == confirmation_id)
        .first()
    )
    if not confirmation:
        raise ValueError(f"Confirmation {confirmation_id} not found")

    confirmation.status = status
    confirmation.confirmer_name = confirmer_name
    confirmation.note = note
    confirmation.confirmed_at = datetime.now()

    if status == "approved":
        confirmation.subsidy_record.confirmed = True
        confirmation.subsidy_record.confirmed_by = confirmer_name

    db.commit()
    db.refresh(confirmation)
    return confirmation


def get_reconciliation(
    db: Session, community_id: uuid.UUID | None = None
) -> list[dict]:
    query = db.query(Elder)
    if community_id:
        query = query.filter(Elder.community_id == community_id)

    elders = query.all()
    result = []
    for elder in elders:
        records = (
            db.query(SubsidyRecord)
            .filter(SubsidyRecord.elder_id == elder.id)
            .all()
        )
        exceed_count = sum(1 for r in records if r.is_exceed)
        unconfirmed_count = sum(1 for r in records if r.is_exceed and not r.confirmed)
        result.append(
            {
                "elder_id": str(elder.id),
                "elder_name": elder.name,
                "quota": elder.subsidy_quota,
                "used": elder.subsidy_used,
                "balance": elder.subsidy_quota - elder.subsidy_used,
                "record_count": len(records),
                "exceed_count": exceed_count,
                "unconfirmed_count": unconfirmed_count,
            }
        )
    return result


def _notify_subsidy_exceed(
    db: Session, elder: Elder, amount: float, current_balance: float
):
    for contact in elder.family_contacts:
        notification = Notification(
            notify_type="subsidy_exceed",
            recipient_type="family",
            recipient_id=contact.id,
            recipient_phone=contact.phone,
            content=f"尊敬的{contact.name}，{elder.name}的补贴余额为{current_balance:.2f}元，"
            f"本次用餐{amount:.2f}元超出余额，请确认是否继续配送。",
            status="pending",
            related_id=elder.id,
            related_type="subsidy_exceed",
        )
        db.add(notification)
