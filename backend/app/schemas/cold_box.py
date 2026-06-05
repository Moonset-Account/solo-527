import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ColdBoxOut(BaseModel):
    id: uuid.UUID
    route_id: uuid.UUID
    serial_number: str
    current_temp: float
    is_abnormal: bool
    last_checked_at: datetime

    class Config:
        from_attributes = True


class ColdBoxTempUpdate(BaseModel):
    temperature: float


class ColdBoxAlertOut(BaseModel):
    id: uuid.UUID
    cold_box_id: uuid.UUID
    temperature: float
    threshold: float
    review_task_id: Optional[uuid.UUID] = None
    created_at: datetime
    is_resolved: bool

    class Config:
        from_attributes = True


class ReviewTaskOut(BaseModel):
    id: uuid.UUID
    task_type: str
    related_id: uuid.UUID
    status: str
    assigned_to: Optional[str] = None
    result: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReviewTaskComplete(BaseModel):
    result: str
    assigned_to: Optional[str] = None
