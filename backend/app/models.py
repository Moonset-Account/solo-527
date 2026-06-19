from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Date, Time, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum


class UserRole(str, enum.Enum):
    DISPATCHER = "dispatcher"
    ADMIN = "admin"
    COUNSELOR = "counselor"


class AppointmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    RETRYING = "retrying"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    real_name = Column(String(50), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.DISPATCHER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    created_appointments = relationship("Appointment", foreign_keys="Appointment.created_by", back_populates="creator")
    operation_logs = relationship("OperationLog", back_populates="operator")


class Counselor(Base):
    __tablename__ = "counselors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    gender = Column(String(10))
    phone = Column(String(20))
    email = Column(String(100))
    specialty = Column(String(200))
    title = Column(String(50))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    schedules = relationship("Schedule", back_populates="counselor")


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    day_of_week = Column(Integer)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    schedules = relationship("Schedule", back_populates="time_slot")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    counselor_id = Column(Integer, ForeignKey("counselors.id"), nullable=False)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=False)
    schedule_date = Column(Date, nullable=False)
    max_appointments = Column(Integer, default=1)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    counselor = relationship("Counselor", back_populates="schedules")
    time_slot = relationship("TimeSlot", back_populates="schedules")
    appointments = relationship("Appointment", back_populates="schedule")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)
    visitor_name = Column(String(50), nullable=False)
    visitor_phone = Column(String(20), nullable=False)
    visitor_gender = Column(String(10))
    visitor_age = Column(Integer)
    visit_reason = Column(Text, nullable=False)
    notes = Column(Text)
    status = Column(String(20), default=AppointmentStatus.PENDING)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_operation = Column(JSON)

    schedule = relationship("Schedule", back_populates="appointments")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_appointments")


class NoShowList(Base):
    __tablename__ = "no_show_list"

    id = Column(Integer, primary_key=True, index=True)
    visitor_phone = Column(String(20), unique=True, nullable=False)
    visitor_name = Column(String(50))
    reason = Column(Text)
    no_show_count = Column(Integer, default=1)
    is_blocked = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class OperationLog(Base):
    __tablename__ = "operation_logs"

    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    operation_type = Column(String(50), nullable=False)
    target_type = Column(String(50), nullable=False)
    target_id = Column(Integer)
    old_value = Column(JSON)
    new_value = Column(JSON)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    operator = relationship("User", back_populates="operation_logs")


class APITask(Base):
    __tablename__ = "api_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String(100), unique=True, index=True)
    task_name = Column(String(100), nullable=False)
    status = Column(String(20), default=TaskStatus.PENDING)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    error_message = Column(Text)
    error_traceback = Column(Text)
    request_data = Column(JSON)
    response_data = Column(JSON)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
