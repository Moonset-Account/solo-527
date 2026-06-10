from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class ApplicationStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    SCREENING = "screening"
    SCREENING_PASSED = "screening_passed"
    ASSESSMENT = "assessment"
    ASSESSMENT_PASSED = "assessment_passed"
    INTERVIEW = "interview"
    INTERVIEW_PASSED = "interview_passed"
    OFFER = "offer"
    OFFER_ACCEPTED = "offer_accepted"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class ApplicationStage(str, enum.Enum):
    RESUME_SCREEN = "resume_screen"
    ASSESSMENT = "assessment"
    TECH_INTERVIEW = "tech_interview"
    HR_INTERVIEW = "hr_interview"
    OFFER = "offer"
    ONBOARDING = "onboarding"


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False)
    position_id = Column(Integer, ForeignKey("positions.id"), nullable=False)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.SUBMITTED, nullable=False)
    current_stage = Column(Enum(ApplicationStage), default=ApplicationStage.RESUME_SCREEN, nullable=False)
    source_channel = Column(String(50))
    referral_by = Column(Integer, ForeignKey("users.id"))
    assigned_recruiter = Column(Integer, ForeignKey("users.id"))
    resume_version = Column(String(50))
    notes = Column(Text)
    rating = Column(Integer)
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    candidate = relationship("Candidate", back_populates="applications")
    position = relationship("Position", back_populates="applications")
    status_history = relationship("ApplicationStatusHistory", back_populates="application", order_by="ApplicationStatusHistory.changed_at.desc()")
    interviews = relationship("Interview", back_populates="application")
