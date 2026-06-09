from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class SmsTemplate(Base):
    __tablename__ = "sms_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    content = Column(Text, nullable=False)
    risk_level_min = Column(String(20), default="medium")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SmsRecord(Base):
    __tablename__ = "sms_records"

    id = Column(Integer, primary_key=True, index=True)
    risk_score_id = Column(Integer, ForeignKey("risk_scores.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("sms_templates.id"), nullable=False)
    phone_number = Column(String(20), nullable=True)
    content = Column(Text, nullable=False)
    send_status = Column(String(20), default="pending")
    send_time = Column(DateTime, nullable=True)
    delivered = Column(Boolean, nullable=True)
    delivery_time = Column(DateTime, nullable=True)
    failure_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    risk_score = relationship("RiskScore", back_populates="smss")
    template = relationship("SmsTemplate")
