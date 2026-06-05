from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.violation import ViolationSeverity, ViolationStatus


class ViolationBase(BaseModel):
    vendor_id: int
    event_date: Optional[datetime] = None
    severity: ViolationSeverity = ViolationSeverity.MINOR
    title: str
    description: str


class ViolationCreate(ViolationBase):
    pass


class ViolationUpdate(BaseModel):
    status: Optional[ViolationStatus] = None
    severity: Optional[ViolationSeverity] = None
    action_taken: Optional[str] = None
    resolution_notes: Optional[str] = None


class ViolationResponse(ViolationBase):
    id: int
    reported_by: Optional[int] = None
    status: ViolationStatus
    action_taken: Optional[str] = None
    resolution_notes: Optional[str] = None
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
