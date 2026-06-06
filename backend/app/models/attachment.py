from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class AttachmentType(str, enum.Enum):
    IMAGE = "image"
    DOCUMENT = "document"
    VIDEO = "video"
    OTHER = "other"


class AttachmentPurpose(str, enum.Enum):
    BEFORE_CLEANING = "before_cleaning"
    AFTER_CLEANING = "after_cleaning"
    MAINTENANCE_BEFORE = "maintenance_before"
    MAINTENANCE_AFTER = "maintenance_after"
    INSPECTION = "inspection"
    OTHER = "other"


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    cleaning_task_id = Column(Integer, ForeignKey("cleaning_tasks.id"))
    maintenance_order_id = Column(Integer, ForeignKey("maintenance_orders.id"))
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    object_name = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    content_type = Column(String(100))
    file_size = Column(Integer)
    attachment_type = Column(Enum(AttachmentType), default=AttachmentType.IMAGE)
    purpose = Column(Enum(AttachmentPurpose), default=AttachmentPurpose.OTHER)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    cleaning_task = relationship("CleaningTask", back_populates="attachments")
    maintenance_order = relationship("MaintenanceOrder", back_populates="attachments")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content = Column(String(1000))
    notification_type = Column(String(50), index=True)
    related_id = Column(Integer)
    is_read = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
