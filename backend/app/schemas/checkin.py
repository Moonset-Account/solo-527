from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.models.checkin import CheckInStatus, AttendanceFeedback


class CheckInBase(BaseModel):
    event_id: int
    registration_id: int
    device_id: Optional[int] = None
    checkin_method: Optional[str] = None
    remark: Optional[str] = None


class CheckInCreate(CheckInBase):
    pass


class CheckInByCode(BaseModel):
    registration_no: str
    device_id: Optional[int] = None
    checkin_method: Optional[str] = None


class CheckInResponse(BaseModel):
    id: int
    event_id: int
    registration_id: int
    device_id: Optional[int] = None
    operator_id: Optional[int] = None
    checkin_time: datetime
    status: CheckInStatus
    attendance_feedback: AttendanceFeedback
    checkin_method: Optional[str] = None
    remark: Optional[str] = None
    
    registration_real_name: Optional[str] = None
    registration_no: Optional[str] = None
    device_name: Optional[str] = None
    operator_name: Optional[str] = None

    class Config:
        from_attributes = True


class CheckInListResponse(BaseModel):
    total: int
    items: List[CheckInResponse]


class AttendanceFeedbackUpdate(BaseModel):
    feedback: AttendanceFeedback
    remark: Optional[str] = None
