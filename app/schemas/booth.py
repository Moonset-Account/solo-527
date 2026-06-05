from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.booth import BoothStatus, AssignmentStatus


class BoothBase(BaseModel):
    booth_number: str
    zone: Optional[str] = None
    position_order: int
    size: Optional[str] = None
    description: Optional[str] = None


class BoothCreate(BoothBase):
    pass


class BoothResponse(BoothBase):
    id: int
    status: BoothStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BoothAssignmentBase(BaseModel):
    booth_id: int
    vendor_id: int
    application_id: int
    event_date: datetime


class BoothAssignmentResponse(BoothAssignmentBase):
    id: int
    status: AssignmentStatus
    lottery_round: int
    assigned_at: datetime
    confirmed_at: Optional[datetime] = None
    notes: Optional[str] = None
    booth: Optional[BoothResponse] = None

    class Config:
        from_attributes = True


class LotteryRequest(BaseModel):
    event_date: datetime
    zone: Optional[str] = None


class LotteryResult(BaseModel):
    success: bool
    message: str
    assignments: List[BoothAssignmentResponse] = []
    total_applications: int
    total_booths: int
    assigned_count: int
