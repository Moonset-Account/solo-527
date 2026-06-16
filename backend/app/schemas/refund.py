import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class RefundBase(BaseModel):
    ar_record_id: uuid.UUID
    amount: Decimal = Field(..., gt=0)
    reason: str = Field(..., max_length=500)
    status: str = Field(default="pending", max_length=30)
    applicant: str = Field(..., max_length=100)
    reviewer: Optional[str] = Field(None, max_length=100)
    review_note: Optional[str] = Field(None, max_length=500)


class RefundCreate(RefundBase):
    pass


class RefundUpdate(BaseModel):
    ar_record_id: Optional[uuid.UUID] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    reason: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = Field(None, max_length=30)
    applicant: Optional[str] = Field(None, max_length=100)
    reviewer: Optional[str] = Field(None, max_length=100)
    review_note: Optional[str] = Field(None, max_length=500)


class RefundResponse(RefundBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RefundListResponse(BaseModel):
    items: list[RefundResponse]
    total: int
    page: int
    page_size: int
