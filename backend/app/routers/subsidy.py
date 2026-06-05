import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.subsidy import SubsidyRecord, SubsidyExceedConfirmation
from app.models.elder import Elder
from app.schemas.subsidy import (
    SubsidyRecordOut,
    SubsidyExceedConfirmOut,
    SubsidyCheckResult,
    SubsidyReconciliationItem,
)
from app.services.subsidy_check import check_subsidy_balance, deduct_subsidy, get_reconciliation

router = APIRouter(prefix="/api/subsidies", tags=["subsidies"])


@router.get("/check", response_model=SubsidyCheckResult)
def check_balance(
    elder_id: uuid.UUID, order_amount: float, db: Session = Depends(get_db)
):
    try:
        return check_subsidy_balance(db, elder_id, order_amount)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/deduct", response_model=SubsidyRecordOut)
def deduct(
    elder_id: uuid.UUID,
    order_id: uuid.UUID,
    amount: float,
    force: bool = False,
    db: Session = Depends(get_db),
):
    try:
        return deduct_subsidy(db, elder_id, order_id, amount, force=force)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/records/{elder_id}", response_model=list[SubsidyRecordOut])
def get_elder_records(elder_id: uuid.UUID, db: Session = Depends(get_db)):
    records = (
        db.query(SubsidyRecord)
        .filter(SubsidyRecord.elder_id == elder_id)
        .order_by(SubsidyRecord.created_at.desc())
        .all()
    )
    return records


@router.get("/confirmations/pending", response_model=list[SubsidyExceedConfirmOut])
def get_pending_confirmations(db: Session = Depends(get_db)):
    confirmations = (
        db.query(SubsidyExceedConfirmation)
        .filter(SubsidyExceedConfirmation.status == "pending")
        .all()
    )
    return confirmations


@router.post("/confirmations/{confirmation_id}/approve", response_model=SubsidyExceedConfirmOut)
def approve_confirmation(
    confirmation_id: uuid.UUID,
    confirmer_name: str,
    note: Optional[str] = None,
    db: Session = Depends(get_db),
):
    from app.services.subsidy_check import confirm_subsidy_exceed

    try:
        return confirm_subsidy_exceed(
            db, confirmation_id, confirmer_name, "approved", note
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/reconciliation", response_model=list[SubsidyReconciliationItem])
def reconciliation(
    community_id: Optional[uuid.UUID] = None, db: Session = Depends(get_db)
):
    data = get_reconciliation(db, community_id)
    return [SubsidyReconciliationItem(**item) for item in data]
