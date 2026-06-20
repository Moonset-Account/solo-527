from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class TenantCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(max_length=128)
    code: str = Field(max_length=64)
    contact_email: Optional[str] = Field(default=None, max_length=256)
    contact_phone: Optional[str] = Field(default=None, max_length=32)
    plan_id: Optional[str] = Field(default=None, max_length=36)
    is_active: bool = True
    notes: Optional[str] = None
    health_score: int = 100


class TenantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(max_length=36)
    name: str = Field(max_length=128)
    code: str = Field(max_length=64)
    contact_email: Optional[str] = Field(default=None, max_length=256)
    contact_phone: Optional[str] = Field(default=None, max_length=32)
    plan_id: Optional[str] = Field(default=None, max_length=36)
    is_active: bool
    notes: Optional[str] = None
    health_score: int
    created_at: datetime
    updated_at: datetime


class TenantUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = Field(default=None, max_length=128)
    code: Optional[str] = Field(default=None, max_length=64)
    contact_email: Optional[str] = Field(default=None, max_length=256)
    contact_phone: Optional[str] = Field(default=None, max_length=32)
    plan_id: Optional[str] = Field(default=None, max_length=36)
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    health_score: Optional[int] = None


class FeatureFlagCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant_id: str = Field(max_length=36)
    flag_key: str = Field(max_length=128)
    flag_name: str = Field(max_length=256)
    is_enabled: bool = False
    notes: Optional[str] = None


class FeatureFlagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(max_length=36)
    tenant_id: str = Field(max_length=36)
    flag_key: str = Field(max_length=128)
    flag_name: str = Field(max_length=256)
    is_enabled: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class FeatureFlagUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant_id: Optional[str] = Field(default=None, max_length=36)
    flag_key: Optional[str] = Field(default=None, max_length=128)
    flag_name: Optional[str] = Field(default=None, max_length=256)
    is_enabled: Optional[bool] = None
    notes: Optional[str] = None
