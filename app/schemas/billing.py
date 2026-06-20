from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class BillCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant_id: str = Field(max_length=36)
    plan_id: Optional[str] = Field(default=None, max_length=36)
    period_start: datetime
    period_end: datetime
    amount: float = 0
    call_count: int = 0
    status: str = Field(default="pending", max_length=32)
    notes: Optional[str] = None
    is_active: bool = True


class BillResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(max_length=36)
    tenant_id: str = Field(max_length=36)
    plan_id: Optional[str] = Field(default=None, max_length=36)
    period_start: datetime
    period_end: datetime
    amount: float
    call_count: int
    status: str = Field(max_length=32)
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class BillUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant_id: Optional[str] = Field(default=None, max_length=36)
    plan_id: Optional[str] = Field(default=None, max_length=36)
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
    amount: Optional[float] = None
    call_count: Optional[int] = None
    status: Optional[str] = Field(default=None, max_length=32)
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class InvoiceHeaderCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant_id: str = Field(max_length=36)
    company_name: str = Field(max_length=256)
    tax_id: Optional[str] = Field(default=None, max_length=64)
    address: Optional[str] = Field(default=None, max_length=512)
    phone: Optional[str] = Field(default=None, max_length=32)
    bank_name: Optional[str] = Field(default=None, max_length=128)
    bank_account: Optional[str] = Field(default=None, max_length=64)
    is_default: bool = False
    is_active: bool = True
    notes: Optional[str] = None


class InvoiceHeaderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(max_length=36)
    tenant_id: str = Field(max_length=36)
    company_name: str = Field(max_length=256)
    tax_id: Optional[str] = Field(default=None, max_length=64)
    address: Optional[str] = Field(default=None, max_length=512)
    phone: Optional[str] = Field(default=None, max_length=32)
    bank_name: Optional[str] = Field(default=None, max_length=128)
    bank_account: Optional[str] = Field(default=None, max_length=64)
    is_default: bool
    is_active: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class InvoiceHeaderUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant_id: Optional[str] = Field(default=None, max_length=36)
    company_name: Optional[str] = Field(default=None, max_length=256)
    tax_id: Optional[str] = Field(default=None, max_length=64)
    address: Optional[str] = Field(default=None, max_length=512)
    phone: Optional[str] = Field(default=None, max_length=32)
    bank_name: Optional[str] = Field(default=None, max_length=128)
    bank_account: Optional[str] = Field(default=None, max_length=64)
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
