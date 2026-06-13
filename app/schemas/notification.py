from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NotificationBase(BaseModel):
    type: str
    title: str
    content: Optional[str] = None
    user_id: int
    related_id: Optional[int] = None
    related_type: Optional[str] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    id: int
    is_read: bool
    created_at: datetime
    related_url: Optional[str] = None
    related_title: Optional[str] = None

    class Config:
        from_attributes = True


class NotificationMarkRead(BaseModel):
    ids: Optional[list[int]] = None
    all: bool = False
