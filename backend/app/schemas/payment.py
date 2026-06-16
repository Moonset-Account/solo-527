import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class PaymentBase(BaseModel):
    ar_record_id: uuid.UUID
    amount: Decimal = Field(..., gt=0)
    payment_date: date
    payment_method: str = Field(..., max_length=50)
    reference_number: Optional[str] = Field(None, max_length=100)
    status: str = Field(default="pending", max_length=30)
    operator: str = Field(..., max_length=100)


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    ar_record_id: Optional[uuid.UUID] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    payment_date: Optional[date] = None
    payment_method: Optional[str] = Field(None, max_length=50)
    reference_number: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=30)
    operator: Optional[str] = Field(None, max_length=100)


class PaymentResponse(PaymentBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaymentListResponse(BaseModel):
    items: list[PaymentResponse]
    total: int
    page: int
    page_size: int
