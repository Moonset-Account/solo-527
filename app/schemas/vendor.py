from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.vendor import VendorStatus, ApplicationStatus


class VendorBase(BaseModel):
    name: str
    contact_person: str
    phone: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    description: Optional[str] = None


class VendorCreate(VendorBase):
    pass


class VendorResponse(VendorBase):
    id: int
    status: VendorStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VendorApplicationBase(BaseModel):
    vendor_id: int
    category_id: int
    event_date: datetime
    product_description: Optional[str] = None
    booth_preference: Optional[str] = None


class VendorApplicationCreate(VendorApplicationBase):
    pass


class VendorApplicationResponse(VendorApplicationBase):
    id: int
    status: ApplicationStatus
    review_notes: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
