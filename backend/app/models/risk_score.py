from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class RiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    model_version_id = Column(Integer, ForeignKey("model_versions.id"), nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)
    risk_threshold = Column(Float, default=0.5)
    top_features = Column(JSON, nullable=True)
    shap_values = Column(JSON, nullable=True)
    recommendation = Column(String(500), nullable=True)
    sms_template_id = Column(Integer, nullable=True)
    needs_callback = Column(Boolean, default=False)
    is_override = Column(Boolean, default=False)
    override_reason = Column(Text, nullable=True)
    batch_id = Column(String(50), nullable=True, index=True)
    scoring_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointment = relationship("Appointment", back_populates="risk_scores")
    model_version = relationship("ModelVersion")
    smss = relationship("SmsRecord", back_populates="risk_score", cascade="all, delete-orphan")
    callbacks = relationship("CallbackRecord", back_populates="risk_score", cascade="all, delete-orphan")
