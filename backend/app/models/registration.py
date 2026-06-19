from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base
import enum


class RegistrationStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    REFUND_EXCEPTION = "refund_exception"


class RegistrationQuality(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    registration_no = Column(String(50), unique=True, index=True, nullable=False)
    
    real_name = Column(String(100), nullable=False)
    id_card_no = Column(String(50), index=True)
    phone = Column(String(20), index=True)
    email = Column(String(100))
    company = Column(String(200))
    position = Column(String(100))
    
    ticket_type = Column(String(50))
    ticket_price = Column(Integer, default=0)
    
    status = Column(Enum(RegistrationStatus), default=RegistrationStatus.PENDING, index=True)
    quality = Column(Enum(RegistrationQuality), default=RegistrationQuality.MEDIUM, index=True)
    
    extra_data = Column(JSON, default=dict)
    remark = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    event = relationship("Event", back_populates="registrations")
    checkins = relationship("CheckIn", back_populates="registration")
    quality_histories = relationship("RegistrationQualityHistory", back_populates="registration")
    refund_exceptions = relationship("RefundException", back_populates="registration")
    operation_logs = relationship("OperationLog", back_populates="registration")

    __mapper_args__ = {
        "eager_defaults": True
    }
