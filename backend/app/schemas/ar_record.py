import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class ARRecordBase(BaseModel):
    customer_name: str = Field(..., max_length=200)
    customer_id: str = Field(..., max_length=50)
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(default="CNY", max_length=10)
    due_date: date
    status: str = Field(default="pending", max_length=30)
    responsible_person: str = Field(..., max_length=100)
    description: Optional[str] = None
    subscription_id: Optional[str] = Field(None, max_length=50)


class ARRecordCreate(ARRecordBase):
    pass


class ARRecordUpdate(BaseModel):
    customer_name: Optional[str] = Field(None, max_length=200)
    customer_id: Optional[str] = Field(None, max_length=50)
    amount: Optional[Decimal] = Field(None, gt=0)
    currency: Optional[str] = Field(None, max_length=10)
    due_date: Optional[date] = None
    status: Optional[str] = Field(None, max_length=30)
    responsible_person: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    subscription_id: Optional[str] = Field(None, max_length=50)


class ARRecordResponse(ARRecordBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    paid_amount: Decimal = Decimal("0")

    model_config = {"from_attributes": True}


class ARRecordSummary(BaseModel):
    customer_name: str
    total_amount: Decimal = Decimal("0")
    paid_amount: Decimal = Decimal("0")
    outstanding_amount: Decimal = Decimal("0")
    status: str


class ARRecordListResponse(BaseModel):
    items: list[ARRecordResponse]
    total: int
    page: int
    page_size: int
