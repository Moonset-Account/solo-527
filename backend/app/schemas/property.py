from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from app.models import PropertyStatus


class PropertyBase(BaseModel):
    name: str
    community: str
    building: Optional[str] = None
    room_number: str
    address: Optional[str] = None
    area: Optional[float] = None
    bedroom_count: Optional[int] = 1
    bathroom_count: Optional[int] = 1
    status: Optional[PropertyStatus] = PropertyStatus.ACTIVE
    remarks: Optional[str] = None


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    community: Optional[str] = None
    building: Optional[str] = None
    room_number: Optional[str] = None
    address: Optional[str] = None
    area: Optional[float] = None
    bedroom_count: Optional[int] = None
    bathroom_count: Optional[int] = None
    status: Optional[PropertyStatus] = None
    remarks: Optional[str] = None


class PropertyResponse(PropertyBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
