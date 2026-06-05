import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NotificationOut(BaseModel):
    id: uuid.UUID
    notify_type: str
    recipient_type: str
    recipient_id: uuid.UUID
    recipient_phone: str
    content: str
    status: str
    retry_count: int
    next_retry_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationCreate(BaseModel):
    notify_type: str
    recipient_type: str
    recipient_id: uuid.UUID
    recipient_phone: str
    content: str
    related_id: Optional[uuid.UUID] = None
    related_type: Optional[str] = None
