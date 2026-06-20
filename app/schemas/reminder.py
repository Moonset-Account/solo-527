from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ReminderCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant_id: Optional[str] = Field(default=None, max_length=36)
    reminder_type: str = Field(max_length=64)
    title: str = Field(max_length=256)
    content: Optional[str] = None
    trigger_at: Optional[datetime] = None
    is_sent: bool = False
    is_active: bool = True
    notes: Optional[str] = None


class ReminderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(max_length=36)
    tenant_id: Optional[str] = Field(default=None, max_length=36)
    reminder_type: str = Field(max_length=64)
    title: str = Field(max_length=256)
    content: Optional[str] = None
    trigger_at: Optional[datetime] = None
    is_sent: bool
    is_active: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ReminderUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tenant_id: Optional[str] = Field(default=None, max_length=36)
    reminder_type: Optional[str] = Field(default=None, max_length=64)
    title: Optional[str] = Field(default=None, max_length=256)
    content: Optional[str] = None
    trigger_at: Optional[datetime] = None
    is_sent: Optional[bool] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class ReminderVersionCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    reminder_id: str = Field(max_length=36)
    tenant_id: Optional[str] = Field(default=None, max_length=36)
    reminder_type: str = Field(max_length=64)
    title: str = Field(max_length=256)
    content: Optional[str] = None
    trigger_at: Optional[datetime] = None
    is_active: bool = True
    notes: Optional[str] = None
    version: int
    operated_by: Optional[str] = Field(default=None, max_length=128)


class ReminderVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(max_length=36)
    reminder_id: str = Field(max_length=36)
    tenant_id: Optional[str] = Field(default=None, max_length=36)
    reminder_type: str = Field(max_length=64)
    title: str = Field(max_length=256)
    content: Optional[str] = None
    trigger_at: Optional[datetime] = None
    is_active: bool
    notes: Optional[str] = None
    version: int
    operated_by: Optional[str] = Field(default=None, max_length=128)
    created_at: datetime


class ReminderVersionUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    reminder_id: Optional[str] = Field(default=None, max_length=36)
    tenant_id: Optional[str] = Field(default=None, max_length=36)
    reminder_type: Optional[str] = Field(default=None, max_length=64)
    title: Optional[str] = Field(default=None, max_length=256)
    content: Optional[str] = None
    trigger_at: Optional[datetime] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    version: Optional[int] = None
    operated_by: Optional[str] = Field(default=None, max_length=128)
