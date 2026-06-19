from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base
import enum


class TodoStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TodoPriority(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TodoType(str, enum.Enum):
    REFUND_EXCEPTION = "refund_exception"
    QUALITY_REVIEW = "quality_review"
    MANUAL = "manual"
    OTHER = "other"


class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(Enum(TodoStatus), default=TodoStatus.PENDING, index=True)
    priority = Column(Enum(TodoPriority), default=TodoPriority.MEDIUM)
    todo_type = Column(Enum(TodoType), default=TodoType.MANUAL)
    
    registration_id = Column(Integer, ForeignKey("registrations.id"), index=True)
    refund_exception_id = Column(Integer, ForeignKey("refund_exceptions.id"), index=True)
    
    created_by_id = Column(Integer, ForeignKey("users.id"), index=True)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    result = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime)

    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="todos_created")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], back_populates="todos_assigned")
    refund_exception = relationship("RefundException", back_populates="todo", uselist=False)
