from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.application import ApplicationStatus, ApplicationStage


class ApplicationStatusHistory(Base):
    __tablename__ = "application_status_history"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    from_status = Column(Enum(ApplicationStatus))
    to_status = Column(Enum(ApplicationStatus), nullable=False)
    from_stage = Column(Enum(ApplicationStage))
    to_stage = Column(Enum(ApplicationStage))
    changed_by = Column(Integer, ForeignKey("users.id"))
    change_reason = Column(Text)
    channel = Column(String(50))
    cycle_days = Column(Integer)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    remarks = Column(Text)

    application = relationship("Application", back_populates="status_history")
