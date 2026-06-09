from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Date, Time, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    appointment_no = Column(String(50), unique=True, index=True, nullable=False)
    patient_age = Column(Integer, nullable=True)
    patient_gender = Column(String(10), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    doctor_name = Column(String(100), nullable=True)
    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(Time, nullable=False)
    appointment_type = Column(String(50), default="普通门诊")
    is_revisit = Column(Boolean, default=False)
    channel = Column(String(50), default="现场挂号")
    reminder_method = Column(String(20), default="sms")
    days_in_advance = Column(Integer, default=1)
    historical_no_show_count = Column(Integer, default=0)
    historical_total_count = Column(Integer, default=0)
    distance_km = Column(Float, nullable=True)
    weather_condition = Column(String(20), nullable=True)
    is_holiday = Column(Boolean, default=False)
    actual_status = Column(String(20), default="pending")
    actual_status_updated_at = Column(DateTime, nullable=True)
    remark = Column(Text, nullable=True)
    batch_id = Column(String(50), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    department = relationship("Department", back_populates="appointments")
    risk_scores = relationship("RiskScore", back_populates="appointment", cascade="all, delete-orphan")
    feedbacks = relationship("ManualFeedback", back_populates="appointment", cascade="all, delete-orphan")
