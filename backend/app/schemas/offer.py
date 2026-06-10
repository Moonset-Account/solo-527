from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel

from app.models.offer import OfferStatus


class OfferBase(BaseModel):
    application_id: Optional[int] = None
    candidate_id: Optional[int] = None
    position_id: Optional[int] = None
    offer_title: Optional[str] = None
    salary_base: Optional[Decimal] = None
    salary_bonus: Optional[str] = None
    benefits: Optional[str] = None
    department: Optional[str] = None
    report_to: Optional[str] = None
    work_location: Optional[str] = None
    start_date: Optional[date] = None
    probation_months: int = 3
    offer_expiry_date: Optional[date] = None
    status: OfferStatus = OfferStatus.DRAFT


class OfferCreate(OfferBase):
    pass


class OfferUpdate(BaseModel):
    offer_title: Optional[str] = None
    salary_base: Optional[Decimal] = None
    salary_bonus: Optional[str] = None
    benefits: Optional[str] = None
    department: Optional[str] = None
    report_to: Optional[str] = None
    work_location: Optional[str] = None
    start_date: Optional[date] = None
    probation_months: Optional[int] = None
    offer_expiry_date: Optional[date] = None
    status: Optional[OfferStatus] = None
    response_note: Optional[str] = None


class OfferResponse(OfferBase):
    id: int
    sent_at: Optional[datetime] = None
    responded_at: Optional[datetime] = None
    response_note: Optional[str] = None
    created_by: Optional[int] = None
    approved_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
