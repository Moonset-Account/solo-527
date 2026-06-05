from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.notification import NotificationType


class NotificationBase(BaseModel):
    type: NotificationType
    title: str
    message: str
    related_type: Optional[str] = None
    related_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    user_id: int


class Notification(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
