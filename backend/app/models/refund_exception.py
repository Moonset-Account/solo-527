from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base
import enum


class RefundExceptionStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    RESOLVED = "resolved"
    ESCALATED = "escalated"


class RefundException(Base):
    __tablename__ = "refund_exceptions"

    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(Integer, ForeignKey("registrations.id"), nullable=False, index=True)
    exception_type = Column(String(100))
    description = Column(Text)
    status = Column(Enum(RefundExceptionStatus), default=RefundExceptionStatus.PENDING, index=True)
    
    refund_amount = Column(Integer, default=0)
    actual_refund_amount = Column(Integer, default=0)
    
    handled_by = Column(String(100))
    handle_result = Column(Text)
    
    auto_generated = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime)

    registration = relationship("Registration", back_populates="refund_exceptions")
    todo = relationship("Todo", back_populates="refund_exception", uselist=False)
