from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from ..models.storage import CabinetType


class StorageCabinetBase(BaseModel):
    name: str = Field(..., max_length=100)
    code: str = Field(..., max_length=50)
    type: CabinetType = CabinetType.GENERAL
    location: str = Field(..., max_length=200)
    description: Optional[str] = None
    capacity: Optional[int] = None
    temperature_min: Optional[int] = None
    temperature_max: Optional[int] = None


class StorageCabinetCreate(StorageCabinetBase):
    pass


class StorageCabinetUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    type: Optional[CabinetType] = None
    location: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    temperature_min: Optional[int] = None
    temperature_max: Optional[int] = None
    is_active: Optional[bool] = None


class StorageCabinet(StorageCabinetBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[int] = None

    class Config:
        from_attributes = True
