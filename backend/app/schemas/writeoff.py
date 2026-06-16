import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class WriteoffBase(BaseModel):
    ar_record_id: uuid.UUID
    amount: Decimal = Field(..., gt=0)
    reason: str = Field(..., max_length=500)
    status: str = Field(default="pending", max_length=30)
    operator: str = Field(..., max_length=100)
    approver: Optional[str] = Field(None, max_length=100)


class WriteoffCreate(WriteoffBase):
    pass


class WriteoffUpdate(BaseModel):
    ar_record_id: Optional[uuid.UUID] = None
    amount: Optional[Decimal] = Field(None, gt=0)
    reason: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = Field(None, max_length=30)
    operator: Optional[str] = Field(None, max_length=100)
    approver: Optional[str] = Field(None, max_length=100)


class WriteoffResponse(WriteoffBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WriteoffListResponse(BaseModel):
    items: list[WriteoffResponse]
    total: int
    page: int
    page_size: int
