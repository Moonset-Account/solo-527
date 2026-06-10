from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum, Date, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class OfferStatus(str, enum.Enum):
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    candidate_id = Column(Integer, ForeignKey("candidates.id"))
    position_id = Column(Integer, ForeignKey("positions.id"))
    offer_title = Column(String(200))
    salary_base = Column(Numeric(12, 2))
    salary_bonus = Column(String(200))
    benefits = Column(Text)
    department = Column(String(100))
    report_to = Column(String(100))
    work_location = Column(String(200))
    start_date = Column(Date)
    probation_months = Column(Integer, default=3)
    offer_expiry_date = Column(Date)
    status = Column(Enum(OfferStatus), default=OfferStatus.DRAFT)
    sent_at = Column(DateTime(timezone=True))
    responded_at = Column(DateTime(timezone=True))
    response_note = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    approved_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
