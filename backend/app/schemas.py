from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID
from app.models import (
    EventLevel, EventStatus, NotificationStatus,
    UserRole, AttachmentAccessRole
)


class UserBase(BaseModel):
    name: str
    email: str
    role: UserRole


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User


class CheckpointBase(BaseModel):
    name: str
    description: Optional[str] = None
    lat: float
    lng: float


class CheckpointCreate(CheckpointBase):
    pass


class Checkpoint(CheckpointBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


class EventBase(BaseModel):
    title: str
    description: str
    level: EventLevel
    checkpoint_id: UUID
    actual_occurred_at: datetime
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    original_record_url: Optional[str] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    level: Optional[EventLevel] = None
    status: Optional[EventStatus] = None
    reviewer_id: Optional[UUID] = None
    notification_status: Optional[NotificationStatus] = None


class Event(BaseModel):
    id: UUID
    title: str
    description: str
    level: EventLevel
    status: EventStatus
    checkpoint_id: Optional[UUID] = None
    checkpoint_name: Optional[str] = None
    teacher_id: Optional[UUID] = None
    teacher_name: Optional[str] = None
    reviewer_id: Optional[UUID] = None
    reviewer_name: Optional[str] = None
    actual_occurred_at: datetime
    recorded_at: datetime
    confirmed_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    notification_status: NotificationStatus
    notification_attempts: int
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    original_record_url: Optional[str] = None
    handle_duration_minutes: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EventListResponse(BaseModel):
    items: List[Event]
    total: int
    page: int
    page_size: int


class NotificationLogBase(BaseModel):
    event_id: UUID
    status: NotificationStatus
    error_message: Optional[str] = None


class NotificationLog(NotificationLogBase):
    id: UUID
    sent_at: datetime

    class Config:
        from_attributes = True


class AttachmentBase(BaseModel):
    event_id: UUID
    filename: str
    file_type: str
    file_size: int
    access_role: AttachmentAccessRole = AttachmentAccessRole.ALL


class AttachmentCreate(AttachmentBase):
    storage_path: str
    uploaded_by: UUID


class Attachment(BaseModel):
    id: UUID
    event_id: UUID
    filename: str
    file_type: str
    file_size: int
    uploaded_by: Optional[UUID] = None
    uploaded_by_name: Optional[str] = None
    access_role: AttachmentAccessRole
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationRateStats(BaseModel):
    total: int
    success: int
    failed: int
    rate: float
    by_level: Dict[str, Dict[str, float]]


class EventStatusStats(BaseModel):
    unconfirmed: int
    processing: int
    closed: int
    by_level: Dict[str, Dict[str, int]]


class HandleDurationStats(BaseModel):
    overall_avg_minutes: float
    by_level: Dict[str, Dict[str, float]]
    by_date: List[Dict[str, float | str | int]]


class PublicReportStats(BaseModel):
    total_events: int
    event_level_distribution: Dict[str, int]
    avg_handle_duration_minutes: float
    notification_success_rate: float
    events_by_month: List[Dict[str, int | str]]
