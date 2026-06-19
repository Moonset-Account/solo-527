from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base
import enum


class DeviceType(str, enum.Enum):
    DESKTOP = "desktop"
    MOBILE = "mobile"
    GATE = "gate"


class DeviceStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    device_code = Column(String(50), unique=True, index=True, nullable=False)
    device_name = Column(String(100), nullable=False)
    device_type = Column(Enum(DeviceType), default=DeviceType.DESKTOP)
    device_status = Column(Enum(DeviceStatus), default=DeviceStatus.ACTIVE)
    location = Column(String(200))
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    last_checkin_time = Column(DateTime)
    checkin_count = Column(Integer, default=0)
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    event = relationship("Event", back_populates="devices")
    checkins = relationship("CheckIn", back_populates="device")
