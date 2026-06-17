from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, ForeignKey, Enum,
    Text, JSON
)
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class NotificationType(str, enum.Enum):
    NOTICE = "notice"
    HOMEWORK = "homework"
    REMINDER = "reminder"
    ACTIVITY = "activity"
    EMERGENCY = "emergency"


class NotificationPriority(str, enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    notification_code = Column(String(50), unique=True, index=True, nullable=False)
    type = Column(Enum(NotificationType), default=NotificationType.NOTICE, index=True)
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.NORMAL, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    class_id = Column(Integer, ForeignKey("class_groups.id"), index=True)
    campus_id = Column(Integer, ForeignKey("campuses.id"), index=True)
    target_roles = Column(JSON)
    publisher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    publish_time = Column(DateTime, index=True)
    scheduled_time = Column(DateTime)
    is_draft = Column(Boolean, default=True)
    require_receipt = Column(Boolean, default=False)
    receipt_deadline = Column(DateTime)
    total_receipts = Column(Integer, default=0)
    confirmed_receipts = Column(Integer, default=0)
    attachments = Column(JSON)
    cover_image = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class_group = relationship("ClassGroup", back_populates="notifications")
    receipts = relationship("Receipt", back_populates="notification", cascade="all, delete-orphan")


class ReceiptStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"


class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), index=True)
    status = Column(Enum(ReceiptStatus), default=ReceiptStatus.PENDING, index=True)
    confirmed_at = Column(DateTime)
    remark = Column(Text)
    signature = Column(String(255))
    extra_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    notification = relationship("Notification", back_populates="receipts")
