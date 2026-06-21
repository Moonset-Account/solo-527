from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field


class FollowUpTaskBase(BaseModel):
    type: str = Field(..., max_length=20)
    related_id: int
    related_type: str = Field(..., max_length=20)
    customer_name: str = Field(..., max_length=100)
    customer_phone: str = Field(..., max_length=20)
    pet_name: Optional[str] = Field(None, max_length=100)
    scheduled_time: datetime
    status: str = Field(default="pending", max_length=20)
    content: Optional[str] = None
    result: Optional[str] = None
    next_follow_up: Optional[date] = None
    assigned_to: Optional[int] = None
    completed_at: Optional[datetime] = None


class FollowUpTaskCreate(BaseModel):
    type: str = Field(..., max_length=20)
    related_id: int
    related_type: str = Field(..., max_length=20)
    customer_name: str = Field(..., max_length=100)
    customer_phone: str = Field(..., max_length=20)
    pet_name: Optional[str] = Field(None, max_length=100)
    scheduled_time: datetime
    content: Optional[str] = None
    assigned_to: Optional[int] = None


class FollowUpTaskUpdate(BaseModel):
    type: Optional[str] = Field(None, max_length=20)
    scheduled_time: Optional[datetime] = None
    status: Optional[str] = Field(None, max_length=20)
    content: Optional[str] = None
    result: Optional[str] = None
    next_follow_up: Optional[date] = None
    assigned_to: Optional[int] = None
    completed_at: Optional[datetime] = None


class FollowUpTaskResponse(FollowUpTaskBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class FollowUpTaskListResponse(BaseModel):
    total: int
    items: List[FollowUpTaskResponse]
