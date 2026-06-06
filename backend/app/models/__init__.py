from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.core.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    building = Column(String(100), nullable=False)
    capacity = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    devices = relationship("Device", back_populates="room")
    schedules = relationship("Schedule", back_populates="room")
    ac_strategies = relationship("ACStrategy", back_populates="room")


class Device(Base):
    __tablename__ = "devices"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    room_id = Column(String, ForeignKey("rooms.id"))
    status = Column(String(20), default="online")
    last_seen = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    room = relationship("Room", back_populates="devices")
    energy_data = relationship("EnergyData", back_populates="device")
    alarms = relationship("Alarm", back_populates="device")


class EnergyData(Base):
    __tablename__ = "energy_data"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    device_id = Column(String, ForeignKey("devices.id"))
    timestamp = Column(DateTime, nullable=False, index=True)
    value = Column(Float, nullable=False)
    category = Column(String(20), nullable=False)
    is_estimated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    device = relationship("Device", back_populates="energy_data")
    anomaly = relationship("Anomaly", back_populates="energy_data", uselist=False)


class Alarm(Base):
    __tablename__ = "alarms"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    device_id = Column(String, ForeignKey("devices.id"))
    level = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    device = relationship("Device", back_populates="alarms")
    workorders = relationship("Workorder", secondary="workorder_alarms", back_populates="alarms")


class Workorder(Base):
    __tablename__ = "workorders"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    status = Column(String(20), default="pending")
    priority = Column(String(20), default="medium")
    created_at = Column(DateTime, default=datetime.utcnow)
    assignee = Column(String(100))
    
    alarms = relationship("Alarm", secondary="workorder_alarms", back_populates="workorders")


class WorkorderAlarm(Base):
    __tablename__ = "workorder_alarms"
    
    workorder_id = Column(String, ForeignKey("workorders.id"), primary_key=True)
    alarm_id = Column(String, ForeignKey("alarms.id"), primary_key=True)


class Schedule(Base):
    __tablename__ = "schedules"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    room_id = Column(String, ForeignKey("rooms.id"))
    course_name = Column(String(200), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    student_count = Column(Integer)
    week_type = Column(String(20), default="normal")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    room = relationship("Room", back_populates="schedules")


class Anomaly(Base):
    __tablename__ = "anomalies"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    energy_data_id = Column(String, ForeignKey("energy_data.id"))
    timestamp = Column(DateTime, nullable=False)
    value = Column(Float, nullable=False)
    expected_value = Column(Float)
    deviation = Column(Float)
    severity = Column(String(20), default="medium")
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    energy_data = relationship("EnergyData", back_populates="anomaly")


class ACStrategy(Base):
    __tablename__ = "ac_strategies"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    room_id = Column(String, ForeignKey("rooms.id"))
    timestamp = Column(DateTime, nullable=False)
    target_temp = Column(Float)
    mode = Column(String(20))
    fan_speed = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    room = relationship("Room", back_populates="ac_strategies")
