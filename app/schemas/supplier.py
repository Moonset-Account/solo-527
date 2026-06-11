from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    contact_person: str = Field(..., max_length=100)
    contact_phone: str = Field(..., max_length=20)
    address: Optional[str] = None
    business_license: Optional[str] = None
    qualification_cert: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    business_license: Optional[str] = None
    qualification_cert: Optional[str] = None
    status: Optional[str] = None


class SupplierResponse(SupplierBase):
    id: int
    status: str
    created_at: datetime
    risk_level: Optional[str] = None

    class Config:
        from_attributes = True


class SupplierAuditCreate(BaseModel):
    supplier_id: int
    audit_result: str
    audit_opinion: Optional[str] = None


class SupplierAuditResponse(BaseModel):
    id: int
    supplier_id: int
    auditor_id: int
    auditor_name: Optional[str] = None
    audit_result: str
    audit_opinion: Optional[str] = None
    audited_at: datetime

    class Config:
        from_attributes = True


class RiskAssessmentCreate(BaseModel):
    supplier_id: int
    risk_level: str
    description: Optional[str] = None


class RiskAssessmentResponse(BaseModel):
    id: int
    supplier_id: int
    assessor_id: int
    assessor_name: Optional[str] = None
    risk_level: str
    description: Optional[str] = None
    assessed_at: datetime

    class Config:
        from_attributes = True
