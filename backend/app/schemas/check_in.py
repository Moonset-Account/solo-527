from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.models.check_in import CheckInStatus


class CheckInBase(BaseModel):
    interview_id: int
    check_in_method: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class CheckInCreate(CheckInBase):
    candidate_id: Optional[int] = None


class CheckInResponse(BaseModel):
    id: int
    interview_id: int
    candidate_id: Optional[int] = None
    check_in_time: Optional[datetime] = None
    status: CheckInStatus
    check_in_method: Optional[str] = None
    location: Optional[str] = None
    device_info: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
