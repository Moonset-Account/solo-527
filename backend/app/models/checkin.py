from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base
import enum


class CheckInStatus(str, enum.Enum):
    SUCCESS = "success"
    DUPLICATE = "duplicate"
    INVALID = "invalid"
    CANCELLED = "cancelled"


class AttendanceFeedback(str, enum.Enum):
    PRESENT = "present"
    PARTIAL = "partial"
    ABSENT = "absent"
    UNCONFIRMED = "unconfirmed"


class CheckIn(Base):
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    registration_id = Column(Integer, ForeignKey("registrations.id"), nullable=False, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), index=True)
    operator_id = Column(Integer, ForeignKey("users.id"), index=True)
    
    checkin_time = Column(DateTime, default=datetime.utcnow, index=True)
    status = Column(Enum(CheckInStatus), default=CheckInStatus.SUCCESS)
    attendance_feedback = Column(Enum(AttendanceFeedback), default=AttendanceFeedback.UNCONFIRMED)
    
    checkin_method = Column(String(50))
    remark = Column(Text)

    event = relationship("Event", back_populates="checkins")
    registration = relationship("Registration", back_populates="checkins")
    device = relationship("Device", back_populates="checkins")
    operator = relationship("User", back_populates="checkins")
