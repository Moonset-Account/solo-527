from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Date, Time, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.core.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    location = Column(String(200))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    start_time = Column(Time)
    end_time = Column(Time)
    max_participants = Column(Integer)
    is_active = Column(Boolean, default=True)
    extra_fields = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    registrations = relationship("Registration", back_populates="event")
    devices = relationship("Device", back_populates="event")
    checkins = relationship("CheckIn", back_populates="event")
