from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from ..models.alert import AlertType, NotificationStatus


class DeliveryAlertBase(BaseModel):
    po_id: int
    po_no: str
    old_expected_date: Optional[datetime] = None
    new_expected_date: Optional[datetime] = None
    project_owner_id: Optional[int] = None
    reason: Optional[str] = None


class DeliveryAlertCreate(DeliveryAlertBase):
    pass


class DeliveryAlertInDB(DeliveryAlertBase):
    id: int
    is_resolved: bool
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationBase(BaseModel):
    user_id: int
    alert_type: AlertType
    title: str
    content: Optional[str] = None
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationInDB(NotificationBase):
    id: int
    status: NotificationStatus
    created_at: datetime
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True
