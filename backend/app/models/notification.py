from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from ..database import Base


class NotificationType(PyEnum):
    LOW_STOCK = "low_stock"
    EXPIRY_WARNING = "expiry_warning"
    REQUISITION_CREATED = "requisition_created"
    REQUISITION_APPROVED = "requisition_approved"
    REQUISITION_REJECTED = "requisition_rejected"
    CONFIRMATION_REQUIRED = "confirmation_required"
    SYSTEM = "system"
    INVENTORY_CHECK = "inventory_check"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    related_type = Column(String(50))
    related_id = Column(Integer)
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
