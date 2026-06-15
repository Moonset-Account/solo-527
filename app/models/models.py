from datetime import datetime, date
from sqlalchemy import Column, Integer, String, DateTime, Date, Time, Boolean, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    title = Column(String(50))
    department = Column(String(50), default="口腔科")
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)

    schedules = relationship("Schedule", back_populates="doctor")
    appointments = relationship("Appointment", back_populates="doctor")
    leaves = relationship("TechnicianLeave", back_populates="doctor")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    schedule_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    total_slots = Column(Integer, default=5)
    booked_slots = Column(Integer, default=0)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.now)

    doctor = relationship("Doctor", back_populates="schedules")
    time_slots = relationship("TimeSlot", back_populates="schedule", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="schedule")


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_booked = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)

    schedule = relationship("Schedule", back_populates="time_slots")
    appointment = relationship("Appointment", back_populates="time_slot", uselist=False)


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    appointment_no = Column(String(32), unique=True, index=True, nullable=False)
    patient_name = Column(String(50), nullable=False)
    patient_phone = Column(String(20), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)
    time_slot_id = Column(Integer, ForeignKey("time_slots.id"), nullable=False)
    source = Column(String(30), default="direct")
    service_type = Column(String(50), default="洁牙")
    price = Column(Float, default=0)
    status = Column(String(20), default="pending")
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    doctor = relationship("Doctor", back_populates="appointments")
    schedule = relationship("Schedule", back_populates="appointments")
    time_slot = relationship("TimeSlot", back_populates="appointment")
    checkin = relationship("CheckIn", back_populates="appointment", uselist=False)
    refunds = relationship("Refund", back_populates="appointment")
    process_logs = relationship("ProcessLog", back_populates="appointment")


class CheckIn(Base):
    __tablename__ = "checkins"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False, unique=True)
    checkin_time = Column(DateTime)
    is_no_show = Column(Boolean, default=False)
    operator = Column(String(50))
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.now)

    appointment = relationship("Appointment", back_populates="checkin")


class Waitlist(Base):
    __tablename__ = "waitlists"

    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String(50), nullable=False)
    patient_phone = Column(String(20), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    target_date = Column(Date, nullable=False)
    source = Column(String(30), default="direct")
    status = Column(String(20), default="waiting")
    priority = Column(Integer, default=0)
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    processed_at = Column(DateTime)
    processed_by = Column(String(50))

    doctor = relationship("Doctor")


class Refund(Base):
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, index=True)
    refund_no = Column(String(32), unique=True, index=True, nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    amount = Column(Float, nullable=False)
    reason = Column(Text)
    status = Column(String(20), default="pending")
    operator = Column(String(50))
    processed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.now)

    appointment = relationship("Appointment", back_populates="refunds")


class PricingRule(Base):
    __tablename__ = "pricing_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    service_type = Column(String(50), nullable=False)
    base_price = Column(Float, nullable=False)
    discount = Column(Float, default=0)
    source = Column(String(30), default="all")
    is_active = Column(Boolean, default=True)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(100), unique=True, nullable=False)
    config_value = Column(Text)
    config_type = Column(String(20), default="string")
    description = Column(String(255))
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)


class ConfigChangeLog(Base):
    __tablename__ = "config_change_logs"

    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(100), nullable=False)
    old_value = Column(Text)
    new_value = Column(Text)
    operator = Column(String(50))
    change_type = Column(String(20), default="update")
    created_at = Column(DateTime, default=datetime.now)


class TechnicianLeave(Base):
    __tablename__ = "technician_leaves"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    leave_date = Column(Date, nullable=False)
    leave_type = Column(String(30), default="年假")
    reason = Column(Text)
    status = Column(String(20), default="approved")
    operator = Column(String(50))
    created_at = Column(DateTime, default=datetime.now)

    doctor = relationship("Doctor", back_populates="leaves")


class ProcessLog(Base):
    __tablename__ = "process_logs"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=False)
    action = Column(String(50), nullable=False)
    operator = Column(String(50))
    detail = Column(Text)
    created_at = Column(DateTime, default=datetime.now)

    appointment = relationship("Appointment", back_populates="process_logs")
