import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Numeric, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    PROJECT_MANAGER = "project_manager"
    TEACHER = "teacher"


class EventLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class EventStatus(str, enum.Enum):
    UNCONFIRMED = "unconfirmed"
    PROCESSING = "processing"
    CLOSED = "closed"


class NotificationStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"


class AttachmentAccessRole(str, enum.Enum):
    PROJECT_MANAGER = "project_manager"
    TEACHER = "teacher"
    ALL = "all"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    created_events = relationship("SafetyEvent", foreign_keys="SafetyEvent.teacher_id", back_populates="teacher")
    reviewed_events = relationship("SafetyEvent", foreign_keys="SafetyEvent.reviewer_id", back_populates="reviewer")
    uploaded_attachments = relationship("Attachment", back_populates="uploader")


class Checkpoint(Base):
    __tablename__ = "checkpoints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    lat = Column(Numeric(10, 8), nullable=False)
    lng = Column(Numeric(11, 8), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    events = relationship("SafetyEvent", back_populates="checkpoint")


class SafetyEvent(Base):
    __tablename__ = "safety_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    level = Column(Enum(EventLevel), nullable=False)
    status = Column(Enum(EventStatus), nullable=False, default=EventStatus.UNCONFIRMED)
    checkpoint_id = Column(UUID(as_uuid=True), ForeignKey("checkpoints.id"))
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    actual_occurred_at = Column(DateTime(timezone=True), nullable=False)
    recorded_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    confirmed_at = Column(DateTime(timezone=True))
    closed_at = Column(DateTime(timezone=True))
    notification_status = Column(Enum(NotificationStatus), nullable=False, default=NotificationStatus.PENDING)
    notification_attempts = Column(Integer, nullable=False, default=0)
    location_lat = Column(Numeric(10, 8))
    location_lng = Column(Numeric(11, 8))
    original_record_url = Column(String(500))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    checkpoint = relationship("Checkpoint", back_populates="events")
    teacher = relationship("User", foreign_keys=[teacher_id], back_populates="created_events")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviewed_events")
    notifications = relationship("NotificationLog", back_populates="event", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="event", cascade="all, delete-orphan")


class NotificationLog(Base):
    __tablename__ = "notification_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("safety_events.id", ondelete="CASCADE"))
    status = Column(Enum(NotificationStatus), nullable=False)
    error_message = Column(Text)
    sent_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    event = relationship("SafetyEvent", back_populates="notifications")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("safety_events.id", ondelete="CASCADE"))
    filename = Column(String(255), nullable=False)
    file_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    access_role = Column(Enum(AttachmentAccessRole), nullable=False, default=AttachmentAccessRole.ALL)
    storage_path = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    event = relationship("SafetyEvent", back_populates="attachments")
    uploader = relationship("User", back_populates="uploaded_attachments")
