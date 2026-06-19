from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.registration import RegistrationQuality


class RegistrationQualityHistory(Base):
    __tablename__ = "registration_quality_histories"

    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(Integer, ForeignKey("registrations.id"), nullable=False, index=True)
    old_quality = Column(Enum(RegistrationQuality))
    new_quality = Column(Enum(RegistrationQuality), nullable=False)
    changed_by = Column(String(100))
    reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    registration = relationship("Registration", back_populates="quality_histories")
