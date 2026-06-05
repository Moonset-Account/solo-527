from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Text, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class CheckinStatus(str, enum.Enum):
    PENDING = "pending"
    CHECKED_IN = "checked_in"
    NO_SHOW = "no_show"
    LATE = "late"


class CheckinRecord(Base):
    __tablename__ = "checkin_records"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False, index=True)
    assignment_id = Column(Integer, ForeignKey("booth_assignments.id"), nullable=False, index=True)
    event_date = Column(DateTime, nullable=False, index=True)
    status = Column(Enum(CheckinStatus), default=CheckinStatus.PENDING, index=True)
    checkin_time = Column(DateTime)
    checked_in_by = Column(Integer, ForeignKey("users.id"))
    sales_amount = Column(Numeric(10, 2))
    sales_notes = Column(Text)
    notes = Column(Text)
    deposit_review_triggered = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vendor = relationship("Vendor", back_populates="checkin_records")
    assignment = relationship("BoothAssignment", back_populates="checkin_record")
