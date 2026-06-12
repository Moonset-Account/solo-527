from pydantic import BaseModel
from app.models.asset import AssetStatusEnum
from datetime import datetime


class AssetCreate(BaseModel):
    name: str
    asset_type: str
    model: str | None = None
    serial_number: str | None = None
    location: str | None = None
    status: AssetStatusEnum = AssetStatusEnum.in_use
    config_detail: str | None = None
    owner: str | None = None


class AssetUpdate(BaseModel):
    name: str | None = None
    asset_type: str | None = None
    model: str | None = None
    serial_number: str | None = None
    location: str | None = None
    status: AssetStatusEnum | None = None
    config_detail: str | None = None
    owner: str | None = None


class AssetRead(BaseModel):
    id: int
    name: str
    asset_type: str
    model: str | None
    serial_number: str | None
    location: str | None
    status: AssetStatusEnum
    config_detail: str | None
    owner: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
