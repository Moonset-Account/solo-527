from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field


class ServicePackageBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    price: Decimal
    duration_minutes: int
    is_active: bool = True


class ServicePackageCreate(ServicePackageBase):
    pass


class ServicePackageUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    price: Optional[Decimal] = None
    duration_minutes: Optional[int] = None
    is_active: Optional[bool] = None


class ServicePackageResponse(ServicePackageBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ServicePackageListResponse(BaseModel):
    total: int
    items: List[ServicePackageResponse]
