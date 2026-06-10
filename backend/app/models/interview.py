from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class InterviewType(str, enum.Enum):
    PHONE = "phone"
    VIDEO = "video"
    ONSITE = "onsite"
    ASSESSMENT = "assessment"


class InterviewStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class InterviewResult(str, enum.Enum):
    PASS = "pass"
    FAIL = "fail"
    PENDING = "pending"
    NEED_REVIEW = "need_review"


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    interview_type = Column(Enum(InterviewType), nullable=False)
    round_number = Column(Integer, default=1)
    title = Column(String(200))
    description = Column(Text)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    location = Column(String(200))
    meeting_link = Column(String(500))
    interviewer_ids = Column(Text)
    status = Column(Enum(InterviewStatus), default=InterviewStatus.SCHEDULED, nullable=False)
    result = Column(Enum(InterviewResult), default=InterviewResult.PENDING)
    score = Column(Integer)
    feedback = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    scheduled_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    application = relationship("Application", back_populates="interviews")
    check_in = relationship("CheckInRecord", back_populates="interview", uselist=False)
