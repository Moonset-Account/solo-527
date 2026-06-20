from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class AnomalyCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant_id: str = Field(max_length=36)
    anomaly_type: str = Field(max_length=64)
    api_path: Optional[str] = Field(default=None, max_length=256)
    detail: Optional[str] = None
    severity: str = Field(default="warning", max_length=16)
    status: str = Field(default="open", max_length=32)
    notes: Optional[str] = None
    resolved_at: Optional[datetime] = None


class AnomalyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(max_length=36)
    tenant_id: str = Field(max_length=36)
    anomaly_type: str = Field(max_length=64)
    api_path: Optional[str] = Field(default=None, max_length=256)
    detail: Optional[str] = None
    severity: str = Field(max_length=16)
    status: str = Field(max_length=32)
    notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class AnomalyUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant_id: Optional[str] = Field(default=None, max_length=36)
    anomaly_type: Optional[str] = Field(default=None, max_length=64)
    api_path: Optional[str] = Field(default=None, max_length=256)
    detail: Optional[str] = None
    severity: Optional[str] = Field(default=None, max_length=16)
    status: Optional[str] = Field(default=None, max_length=32)
    notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
