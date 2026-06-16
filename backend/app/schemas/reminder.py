import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ReminderBase(BaseModel):
    ar_record_id: Optional[uuid.UUID] = None
    type: str = Field(..., max_length=30)
    title: str = Field(..., max_length=200)
    message: Optional[str] = None
    assigned_to: str = Field(..., max_length=100)
    status: str = Field(default="pending", max_length=30)
    due_at: datetime
    escalated_at: Optional[datetime] = None
    escalated_to: Optional[str] = Field(None, max_length=100)


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    ar_record_id: Optional[uuid.UUID] = None
    type: Optional[str] = Field(None, max_length=30)
    title: Optional[str] = Field(None, max_length=200)
    message: Optional[str] = None
    assigned_to: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, max_length=30)
    due_at: Optional[datetime] = None
    escalated_at: Optional[datetime] = None
    escalated_to: Optional[str] = Field(None, max_length=100)


class ReminderResponse(ReminderBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReminderListResponse(BaseModel):
    items: list[ReminderResponse]
    total: int
    page: int
    page_size: int
