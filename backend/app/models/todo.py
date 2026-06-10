from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum, Boolean
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class TodoPriority(str, enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class TodoType(str, enum.Enum):
    NORMAL = "normal"
    ESCALATED = "escalated"
    INTERVIEW_CONFLICT = "interview_conflict"
    STATUS_EXPIRED = "status_expired"
    FOLLOW_UP = "follow_up"


class TodoStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    todo_type = Column(Enum(TodoType), default=TodoType.NORMAL)
    priority = Column(Enum(TodoPriority), default=TodoPriority.NORMAL)
    status = Column(Enum(TodoStatus), default=TodoStatus.PENDING)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    related_entity_type = Column(String(50))
    related_entity_id = Column(Integer)
    due_date = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    completed_by = Column(Integer, ForeignKey("users.id"))
    is_escalated = Column(Boolean, default=False)
    escalated_at = Column(DateTime(timezone=True))
    escalation_reason = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ReminderRule(Base):
    __tablename__ = "reminder_rules"

    id = Column(Integer, primary_key=True, index=True)
    rule_name = Column(String(100), nullable=False)
    rule_type = Column(String(50), nullable=False)
    trigger_condition = Column(Text)
    reminder_frequency_minutes = Column(Integer, default=60)
    max_reminders = Column(Integer, default=3)
    is_active = Column(Boolean, default=True)
    notify_channels = Column(String(200))
    escalation_minutes = Column(Integer)
    description = Column(String(500))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
