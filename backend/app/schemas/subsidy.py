import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SubsidyRecordOut(BaseModel):
    id: uuid.UUID
    elder_id: uuid.UUID
    order_id: Optional[uuid.UUID] = None
    amount: float
    balance_before: float
    balance_after: float
    is_exceed: bool
    confirmed: bool
    confirmed_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SubsidyExceedConfirmOut(BaseModel):
    id: uuid.UUID
    elder_id: uuid.UUID
    subsidy_record_id: Optional[uuid.UUID] = None
    confirm_type: str
    confirmer_name: Optional[str] = None
    status: str
    note: Optional[str] = None
    created_at: datetime
    confirmed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SubsidyCheckResult(BaseModel):
    elder_id: uuid.UUID
    current_balance: float
    order_amount: float
    is_exceed: bool
    need_confirmation: bool


class SubsidyReconciliationItem(BaseModel):
    elder_id: uuid.UUID
    elder_name: str
    quota: float
    used: float
    balance: float
    record_count: int
    exceed_count: int
    unconfirmed_count: int
