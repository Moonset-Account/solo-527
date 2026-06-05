from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.deposit import DepositStatus, DepositType


class DepositBase(BaseModel):
    vendor_id: int
    application_id: Optional[int] = None
    amount: Decimal
    deposit_type: DepositType = DepositType.STANDARD
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None


class DepositCreate(DepositBase):
    pass


class DepositUpdate(BaseModel):
    status: Optional[DepositStatus] = None
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    paid_at: Optional[datetime] = None
    refund_method: Optional[str] = None
    refund_transaction_id: Optional[str] = None
    refunded_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    notes: Optional[str] = None


class DepositResponse(DepositBase):
    id: int
    status: DepositStatus
    paid_at: Optional[datetime] = None
    refund_method: Optional[str] = None
    refund_transaction_id: Optional[str] = None
    refunded_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
