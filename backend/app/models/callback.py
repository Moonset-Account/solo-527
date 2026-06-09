from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class CallbackRecord(Base):
    __tablename__ = "callback_records"

    id = Column(Integer, primary_key=True, index=True)
    risk_score_id = Column(Integer, ForeignKey("risk_scores.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    priority = Column(String(20), default="high")
    callback_status = Column(String(20), default="pending")
    callback_result = Column(String(100), nullable=True)
    patient_response = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    callback_time = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    risk_score = relationship("RiskScore", back_populates="callbacks")
    assignee = relationship("User", foreign_keys=[assigned_to])
