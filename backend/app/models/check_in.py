from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class CheckInStatus(str, enum.Enum):
    CHECKED_IN = "checked_in"
    LATE = "late"
    NOT_CHECKED = "not_checked"
    EARLY = "early"


class CheckInRecord(Base):
    __tablename__ = "check_in_records"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id"), unique=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    check_in_time = Column(DateTime(timezone=True))
    status = Column(Enum(CheckInStatus), default=CheckInStatus.NOT_CHECKED)
    check_in_method = Column(String(50))
    location = Column(String(200))
    device_info = Column(String(500))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    interview = relationship("Interview", back_populates="check_in")
