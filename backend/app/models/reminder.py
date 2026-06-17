from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, ForeignKey, Enum,
    Text, JSON, Float
)
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ReminderType(str, enum.Enum):
    HOMEWORK = "homework"
    CONSUMPTION = "consumption"
    RECEIPT = "receipt"
    FEEDBACK = "feedback"
    SCHEDULE = "schedule"
    OTHER = "other"


class ReminderStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    READ = "read"
    DISMISSED = "dismissed"
    FAILED = "failed"


class ReminderPriority(str, enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(ReminderType), default=ReminderType.OTHER, index=True)
    priority = Column(Enum(ReminderPriority), default=ReminderPriority.NORMAL, index=True)
    status = Column(Enum(ReminderStatus), default=ReminderStatus.PENDING, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), index=True)
    class_id = Column(Integer, ForeignKey("class_groups.id"), index=True)
    entity_type = Column(String(50))
    entity_id = Column(Integer)
    scheduled_at = Column(DateTime, index=True)
    sent_at = Column(DateTime)
    read_at = Column(DateTime)
    dismissed_at = Column(DateTime)
    creator_id = Column(Integer, ForeignKey("users.id"))
    channels = Column(JSON)
    retry_count = Column(Integer, default=0)
    is_overdue = Column(Boolean, default=False, index=True)
    related_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", foreign_keys=[creator_id])


class ReportType(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"


class ReportRecord(Base):
    __tablename__ = "report_records"

    id = Column(Integer, primary_key=True, index=True)
    report_code = Column(String(50), unique=True, index=True, nullable=False)
    type = Column(Enum(ReportType), default=ReportType.MONTHLY, index=True)
    title = Column(String(200), nullable=False)
    campus_id = Column(Integer, ForeignKey("campuses.id"), index=True)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    total_classes = Column(Integer, default=0)
    total_schedules = Column(Integer, default=0)
    total_consumptions = Column(Integer, default=0)
    total_hours_consumed = Column(Integer, default=0)
    average_fill_rate = Column(Float, default=0.0)
    class_fill_rates = Column(JSON)
    total_students = Column(Integer, default=0)
    active_students = Column(Integer, default=0)
    homework_completion_rate = Column(Float, default=0.0)
    total_feedbacks = Column(Integer, default=0)
    total_notifications = Column(Integer, default=0)
    receipt_rate = Column(Float, default=0.0)
    generated_by = Column(Integer, ForeignKey("users.id"))
    file_path = Column(String(255))
    summary = Column(Text)
    extra_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
