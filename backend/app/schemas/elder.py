import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class DietaryRestrictionOut(BaseModel):
    id: uuid.UUID
    restriction_type: str
    ingredient: str
    severity: str

    class Config:
        from_attributes = True


class FamilyContactOut(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    kinship: str
    is_primary: bool

    class Config:
        from_attributes = True


class ElderBase(BaseModel):
    name: str
    building: str
    unit: str
    room: str
    phone: str
    subsidy_quota: float = 0.0
    is_temp_suspended: bool = False
    suspend_reason: Optional[str] = None
    suspend_until: Optional[date] = None


class ElderCreate(ElderBase):
    pass


class ElderUpdate(BaseModel):
    name: Optional[str] = None
    building: Optional[str] = None
    unit: Optional[str] = None
    room: Optional[str] = None
    phone: Optional[str] = None
    subsidy_quota: Optional[float] = None
    is_temp_suspended: Optional[bool] = None
    suspend_reason: Optional[str] = None
    suspend_until: Optional[date] = None


class ElderOut(ElderBase):
    id: uuid.UUID
    subsidy_used: float
    dietary_restrictions: list[DietaryRestrictionOut] = []
    family_contacts: list[FamilyContactOut] = []

    class Config:
        from_attributes = True


class ElderListItem(BaseModel):
    id: uuid.UUID
    name: str
    building: str
    unit: str
    room: str
    phone: str
    subsidy_quota: float
    subsidy_used: float
    is_temp_suspended: bool

    class Config:
        from_attributes = True


class TempSuspendRequest(BaseModel):
    is_suspended: bool
    reason: Optional[str] = None
    suspend_until: Optional[date] = None


class FamilyConfirmRequest(BaseModel):
    confirmation_id: uuid.UUID
    confirmer_name: str
    status: str
    note: Optional[str] = None
