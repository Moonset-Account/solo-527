from typing import Optional
from datetime import date
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema, PageParams


class PropertyBase(BaseSchema):
    name: str
    code: str
    address: str
    area: Optional[float] = None
    property_type: str
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    owner_id: int
    status: str = "available"
    description: Optional[str] = None


class PropertyCreate(BaseModel):
    name: str
    code: str
    address: str
    area: Optional[float] = None
    property_type: str
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    owner_id: int
    description: Optional[str] = None


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    area: Optional[float] = None
    property_type: Optional[str] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    owner_id: Optional[int] = None
    status: Optional[str] = None
    description: Optional[str] = None


class PropertyQuery(PageParams):
    keyword: Optional[str] = None
    property_type: Optional[str] = None
    status: Optional[str] = None


class OwnerBase(BaseSchema):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    id_card: Optional[str] = None
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    address: Optional[str] = None
    remark: Optional[str] = None


class OwnerCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    id_card: Optional[str] = None
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    address: Optional[str] = None
    remark: Optional[str] = None


class OwnerUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    id_card: Optional[str] = None
    bank_account: Optional[str] = None
    bank_name: Optional[str] = None
    address: Optional[str] = None
    remark: Optional[str] = None


class OwnerQuery(PageParams):
    keyword: Optional[str] = None


class TenantBase(BaseSchema):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    id_card: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    employee_count: Optional[int] = None
    address: Optional[str] = None
    remark: Optional[str] = None


class TenantCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    id_card: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    employee_count: Optional[int] = None
    address: Optional[str] = None
    remark: Optional[str] = None


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    id_card: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    employee_count: Optional[int] = None
    address: Optional[str] = None
    remark: Optional[str] = None


class TenantQuery(PageParams):
    keyword: Optional[str] = None
    industry: Optional[str] = None
