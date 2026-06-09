from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class ManualFeedback(Base):
    __tablename__ = "manual_feedback"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    risk_score_id = Column(Integer, ForeignKey("risk_scores.id"), nullable=True)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    original_risk_level = Column(String(20), nullable=True)
    corrected_risk_level = Column(String(20), nullable=True)
    original_score = Column(Float, nullable=True)
    corrected_score = Column(Float, nullable=True)
    feedback_type = Column(String(50), default="relabel")
    reason = Column(Text, nullable=True)
    remark = Column(Text, nullable=True)
    is_error_sample = Column(Boolean, default=False)
    error_type = Column(String(50), nullable=True)
    batch_id = Column(String(50), nullable=True, index=True)
    review_status = Column(String(20), default="pending")
    review_comment = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointment = relationship("Appointment", back_populates="feedbacks")
    operator = relationship("User", foreign_keys=[operator_id], back_populates="created_feedback")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviewed_feedback")
    risk_score = relationship("RiskScore")
