from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from ..models.supplier import SupplierRiskLevel, SupplierStatus


class SupplierBase(BaseModel):
    name: str
    code: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    remarks: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    tax_number: Optional[str] = None
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    risk_level: Optional[SupplierRiskLevel] = None
    status: Optional[SupplierStatus] = None
    remarks: Optional[str] = None


class SupplierInDB(SupplierBase):
    id: int
    risk_level: SupplierRiskLevel
    status: SupplierStatus
    credit_rating: int
    on_time_delivery_rate: float
    quality_score: float
    total_orders: int
    total_amount: float
    created_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SupplierRiskLogBase(BaseModel):
    supplier_id: int
    new_level: SupplierRiskLevel
    reason: str


class SupplierRiskLogCreate(SupplierRiskLogBase):
    pass


class SupplierRiskLogInDB(SupplierRiskLogBase):
    id: int
    previous_level: Optional[SupplierRiskLevel] = None
    triggered_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
