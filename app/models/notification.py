from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class NotificationType(str, enum.Enum):
    PRICE_EXPIRY = "price_expiry"
    APPROVAL = "approval"
    DELIVERY = "delivery"
    RISK = "risk"
    SYSTEM = "system"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    is_read = Column(Boolean, default=False)
    related_id = Column(Integer)
    related_type = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
