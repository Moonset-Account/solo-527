from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from ..models.agreement import AgreementStatus


class AgreementItemBase(BaseModel):
    material_id: int
    unit_price: float
    min_order_qty: Optional[float] = 1
    max_order_qty: Optional[float] = None
    delivery_days: Optional[int] = None
    contracted_qty: Optional[float] = None
    remarks: Optional[str] = None


class AgreementItemCreate(AgreementItemBase):
    pass


class AgreementItemInDB(AgreementItemBase):
    id: int
    agreement_id: int
    ordered_qty: float
    created_at: datetime

    class Config:
        from_attributes = True


class FrameworkAgreementBase(BaseModel):
    title: str
    supplier_id: int
    effective_date: date
    expiry_date: date
    total_estimated_amount: Optional[float] = 0
    payment_terms: Optional[str] = None
    delivery_terms: Optional[str] = None
    attachment_url: Optional[str] = None
    remarks: Optional[str] = None
    items: List[AgreementItemCreate]


class FrameworkAgreementCreate(FrameworkAgreementBase):
    pass


class FrameworkAgreementUpdate(BaseModel):
    title: Optional[str] = None
    effective_date: Optional[date] = None
    expiry_date: Optional[date] = None
    total_estimated_amount: Optional[float] = None
    payment_terms: Optional[str] = None
    delivery_terms: Optional[str] = None
    status: Optional[AgreementStatus] = None
    attachment_url: Optional[str] = None
    remarks: Optional[str] = None


class FrameworkAgreementInDB(FrameworkAgreementBase):
    id: int
    agreement_no: str
    used_amount: float
    remaining_amount: float
    status: AgreementStatus
    created_by: Optional[int] = None
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    items: List[AgreementItemInDB] = []

    class Config:
        from_attributes = True
