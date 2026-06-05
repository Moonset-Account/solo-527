from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class BoothStatus(str, enum.Enum):
    AVAILABLE = "available"
    ASSIGNED = "assigned"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"


class AssignmentStatus(str, enum.Enum):
    DRAWN = "drawn"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class Booth(Base):
    __tablename__ = "booths"

    id = Column(Integer, primary_key=True, index=True)
    booth_number = Column(String(50), unique=True, nullable=False, index=True)
    zone = Column(String(50), index=True)
    position_order = Column(Integer, nullable=False)
    size = Column(String(50))
    description = Column(String(500))
    status = Column(Enum(BoothStatus), default=BoothStatus.AVAILABLE, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assignments = relationship("BoothAssignment", back_populates="booth")


class BoothAssignment(Base):
    __tablename__ = "booth_assignments"

    id = Column(Integer, primary_key=True, index=True)
    booth_id = Column(Integer, ForeignKey("booths.id"), nullable=False, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False, index=True)
    application_id = Column(Integer, ForeignKey("vendor_applications.id"), nullable=False, index=True)
    event_date = Column(DateTime, nullable=False, index=True)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.DRAWN, index=True)
    lottery_round = Column(Integer, default=1)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    confirmed_at = Column(DateTime)
    notes = Column(String(500))

    booth = relationship("Booth", back_populates="assignments")
    vendor = relationship("Vendor", back_populates="booth_assignments")
    application = relationship("VendorApplication", back_populates="booth_assignment")
    checkin_record = relationship("CheckinRecord", back_populates="assignment", uselist=False)

    __table_args__ = (
        UniqueConstraint('booth_id', 'event_date', name='unique_booth_per_event'),
    )
