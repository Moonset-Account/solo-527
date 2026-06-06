from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class CleaningTaskStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    SUBMITTED = "submitted"
    INSPECTING = "inspecting"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class CleaningTaskPriority(str, enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class CleaningTask(Base):
    __tablename__ = "cleaning_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_no = Column(String(50), unique=True, index=True, nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    cleaner_id = Column(Integer, ForeignKey("users.id"))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(CleaningTaskStatus), default=CleaningTaskStatus.PENDING, nullable=False, index=True)
    priority = Column(Enum(CleaningTaskPriority), default=CleaningTaskPriority.NORMAL)
    scheduled_time = Column(DateTime(timezone=True), nullable=False)
    deadline_time = Column(DateTime(timezone=True))
    started_at = Column(DateTime(timezone=True))
    submitted_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    estimated_duration = Column(Float, default=2.0, comment="预计时长(小时)")
    actual_duration = Column(Float, comment="实际时长(小时)")
    cleaning_items = Column(Text, comment="清洁项目要求，JSON格式")
    description = Column(Text)
    inspector_remarks = Column(Text)
    is_overdue = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    property = relationship("Property", back_populates="cleaning_tasks")
    cleaner = relationship("User", back_populates="assigned_cleaning_tasks", foreign_keys=[cleaner_id])
    creator = relationship("User", back_populates="created_tasks", foreign_keys=[created_by])
    attachments = relationship("Attachment", back_populates="cleaning_task", cascade="all, delete-orphan")
    material_usages = relationship("MaterialUsage", back_populates="cleaning_task", cascade="all, delete-orphan")
