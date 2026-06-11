from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


class PurchaseRequestBase(BaseModel):
    material_name: str = Field(..., min_length=1, max_length=200)
    specification: Optional[str] = Field(None, max_length=500)
    quantity: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)
    unit: str = Field(..., max_length=20)
    budget: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)
    expected_delivery: date
    remark: Optional[str] = None
    supplier_id: Optional[int] = None
    spec_attachment_id: Optional[int] = None


class PurchaseRequestCreate(PurchaseRequestBase):
    pass


class PurchaseRequestUpdate(BaseModel):
    material_name: Optional[str] = None
    specification: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit: Optional[str] = None
    budget: Optional[Decimal] = None
    expected_delivery: Optional[date] = None
    remark: Optional[str] = None
    supplier_id: Optional[int] = None
    status: Optional[str] = None
    closing_note: Optional[str] = None


class PurchaseRequestResponse(PurchaseRequestBase):
    id: int
    request_no: str
    status: str
    current_approval_level: int
    created_by: int
    created_by_name: Optional[str] = None
    supplier_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PurchaseStatusUpdate(BaseModel):
    status: str
    remark: Optional[str] = None


class ClosePurchaseRequest(BaseModel):
    closing_note: str
