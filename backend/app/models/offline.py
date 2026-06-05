from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.sql import func
from ..database import Base


class OfflineSyncRecord(Base):
    __tablename__ = "offline_sync_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    device_id = Column(String(100))
    sync_type = Column(String(50), nullable=False)
    data = Column(JSON, nullable=False)
    status = Column(String(20), default="pending", nullable=False)
    synced_at = Column(DateTime(timezone=True))
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
