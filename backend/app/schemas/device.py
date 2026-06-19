from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.models.device import DeviceType, DeviceStatus


class DeviceBase(BaseModel):
    device_code: str
    device_name: str
    device_type: DeviceType = DeviceType.DESKTOP
    device_status: DeviceStatus = DeviceStatus.ACTIVE
    location: Optional[str] = None
    event_id: int
    remark: Optional[str] = None


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    device_name: Optional[str] = None
    device_type: Optional[DeviceType] = None
    device_status: Optional[DeviceStatus] = None
    location: Optional[str] = None
    event_id: Optional[int] = None
    remark: Optional[str] = None


class DeviceResponse(DeviceBase):
    id: int
    last_checkin_time: Optional[datetime] = None
    checkin_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DeviceListResponse(BaseModel):
    total: int
    items: List[DeviceResponse]
