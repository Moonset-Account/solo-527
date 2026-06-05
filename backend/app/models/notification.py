import uuid

from sqlalchemy import Column, String, ForeignKey, Text, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    notify_type = Column(String(32), nullable=False)
    recipient_type = Column(String(16), nullable=False)
    recipient_id = Column(UUID(as_uuid=True), nullable=False)
    recipient_phone = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(String(32), default="pending", nullable=False)
    retry_count = Column(Integer, default=0, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)
    next_retry_at = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    related_id = Column(UUID(as_uuid=True), nullable=True)
    related_type = Column(String(32), nullable=True)
