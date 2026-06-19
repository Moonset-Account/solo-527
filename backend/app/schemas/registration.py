from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field

from app.models.registration import RegistrationStatus, RegistrationQuality


class RegistrationBase(BaseModel):
    real_name: str
    id_card_no: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    position: Optional[str] = None
    ticket_type: Optional[str] = None
    ticket_price: int = 0
    extra_data: Optional[Dict[str, Any]] = None
    remark: Optional[str] = None


class RegistrationCreate(RegistrationBase):
    event_id: int


class RegistrationUpdate(BaseModel):
    real_name: Optional[str] = None
    id_card_no: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    position: Optional[str] = None
    ticket_type: Optional[str] = None
    ticket_price: Optional[int] = None
    status: Optional[RegistrationStatus] = None
    quality: Optional[RegistrationQuality] = None
    extra_data: Optional[Dict[str, Any]] = None
    remark: Optional[str] = None


class RegistrationResponse(RegistrationBase):
    id: int
    event_id: int
    registration_no: str
    status: RegistrationStatus
    quality: RegistrationQuality
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RegistrationDetailResponse(RegistrationResponse):
    event: Optional[Dict[str, Any]] = None
    checkin_count: int = 0
    quality_histories: List[Dict[str, Any]] = []


class RegistrationListResponse(BaseModel):
    total: int
    items: List[RegistrationResponse]


class RegistrationQualityUpdate(BaseModel):
    quality: RegistrationQuality
    reason: Optional[str] = None
