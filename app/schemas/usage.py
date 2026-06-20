from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ApiUsageCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant_id: str = Field(max_length=36)
    api_path: str = Field(max_length=256)
    method: str = Field(max_length=16)
    status_code: int
    response_ms: Optional[int] = None
    call_count: int = 1
    period_start: datetime
    period_end: datetime


class ApiUsageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(max_length=36)
    tenant_id: str = Field(max_length=36)
    api_path: str = Field(max_length=256)
    method: str = Field(max_length=16)
    status_code: int
    response_ms: Optional[int] = None
    call_count: int
    period_start: datetime
    period_end: datetime
    created_at: datetime


class ApiUsageUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant_id: Optional[str] = Field(default=None, max_length=36)
    api_path: Optional[str] = Field(default=None, max_length=256)
    method: Optional[str] = Field(default=None, max_length=16)
    status_code: Optional[int] = None
    response_ms: Optional[int] = None
    call_count: Optional[int] = None
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None
