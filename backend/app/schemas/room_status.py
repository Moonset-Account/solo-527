from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from app.models import RoomStatusType


class RoomStatusBase(BaseModel):
    property_id: int
    date: date
    status: RoomStatusType
    guest_name: Optional[str] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    remarks: Optional[str] = None


class RoomStatusCreate(RoomStatusBase):
    pass


class RoomStatusUpdate(BaseModel):
    status: Optional[RoomStatusType] = None
    guest_name: Optional[str] = None
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    remarks: Optional[str] = None


class RoomStatusResponse(RoomStatusBase):
    id: int
    current_cleaning_task_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RoomStatusCalendarQuery(BaseModel):
    start_date: date
    end_date: date
    community: Optional[str] = None
    property_id: Optional[int] = None


class CheckInVerifyRequest(BaseModel):
    property_id: int
    date: date
