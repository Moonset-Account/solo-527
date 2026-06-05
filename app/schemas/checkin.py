from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.checkin import CheckinStatus


class CheckinBase(BaseModel):
    vendor_id: int
    assignment_id: int
    event_date: datetime


class CheckinCreate(CheckinBase):
    pass


class CheckinUpdate(BaseModel):
    status: Optional[CheckinStatus] = None
    checkin_time: Optional[datetime] = None
    notes: Optional[str] = None


class SalesBackfill(BaseModel):
    sales_amount: Decimal
    sales_notes: Optional[str] = None


class CheckinResponse(CheckinBase):
    id: int
    status: CheckinStatus
    checkin_time: Optional[datetime] = None
    checked_in_by: Optional[int] = None
    sales_amount: Optional[Decimal] = None
    sales_notes: Optional[str] = None
    notes: Optional[str] = None
    deposit_review_triggered: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
