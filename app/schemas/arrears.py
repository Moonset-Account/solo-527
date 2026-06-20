from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ArrearCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant_id: str = Field(max_length=36)
    bill_id: Optional[str] = Field(default=None, max_length=36)
    amount: float = 0
    overdue_days: int = 0
    status: str = Field(default="unpaid", max_length=32)
    handler: Optional[str] = Field(default=None, max_length=128)
    handle_result: Optional[str] = None
    notes: Optional[str] = None
    resolved_at: Optional[datetime] = None


class ArrearResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(max_length=36)
    tenant_id: str = Field(max_length=36)
    bill_id: Optional[str] = Field(default=None, max_length=36)
    amount: float
    overdue_days: int
    status: str = Field(max_length=32)
    handler: Optional[str] = Field(default=None, max_length=128)
    handle_result: Optional[str] = None
    notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ArrearUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant_id: Optional[str] = Field(default=None, max_length=36)
    bill_id: Optional[str] = Field(default=None, max_length=36)
    amount: Optional[float] = None
    overdue_days: Optional[int] = None
    status: Optional[str] = Field(default=None, max_length=32)
    handler: Optional[str] = Field(default=None, max_length=128)
    handle_result: Optional[str] = None
    notes: Optional[str] = None
    resolved_at: Optional[datetime] = None


class HealthStatCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant_id: str = Field(max_length=36)
    score: int = 100
    arrears_count: int = 0
    anomaly_count: int = 0
    usage_percent: int = 0
    notes: Optional[str] = None


class HealthStatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(max_length=36)
    tenant_id: str = Field(max_length=36)
    score: int
    arrears_count: int
    anomaly_count: int
    usage_percent: int
    notes: Optional[str] = None
    recorded_at: datetime


class HealthStatUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant_id: Optional[str] = Field(default=None, max_length=36)
    score: Optional[int] = None
    arrears_count: Optional[int] = None
    anomaly_count: Optional[int] = None
    usage_percent: Optional[int] = None
    notes: Optional[str] = None
