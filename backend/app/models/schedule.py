from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, ForeignKey, Enum, Date,
    Time, Text, JSON, Integer as Int
)
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ScheduleStatus(str, enum.Enum):
    PLANNED = "planned"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CourseSchedule(Base):
    __tablename__ = "course_schedules"

    id = Column(Integer, primary_key=True, index=True)
    schedule_code = Column(String(50), unique=True, index=True, nullable=False)
    class_id = Column(Integer, ForeignKey("class_groups.id"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), index=True)
    classroom = Column(String(100))
    course_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer, default=120)
    topic = Column(String(200))
    content = Column(Text)
    status = Column(Enum(ScheduleStatus), default=ScheduleStatus.PLANNED, index=True)
    is_online = Column(Boolean, default=False)
    online_url = Column(String(255))
    max_hours_per_student = Column(Integer, default=2)
    assigned_student_count = Column(Integer, default=0)
    attended_student_count = Column(Integer, default=0)
    remark = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class_group = relationship("ClassGroup", back_populates="schedules")
    teacher = relationship("User", foreign_keys=[teacher_id])
    consumptions = relationship("CourseConsumption", back_populates="schedule", cascade="all, delete-orphan")


class ConsumptionStatus(str, enum.Enum):
    PENDING = "pending"
    CONSUMED = "consumed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    LEAVE_EARLY = "leave_early"
    LEAVE = "leave"


class CourseConsumption(Base):
    __tablename__ = "course_consumptions"

    id = Column(Integer, primary_key=True, index=True)
    consumption_code = Column(String(50), unique=True, index=True, nullable=False)
    schedule_id = Column(Integer, ForeignKey("course_schedules.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    class_id = Column(Integer, ForeignKey("class_groups.id"), index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), index=True)
    consumption_date = Column(Date, nullable=False, index=True)
    hours_consumed = Column(Integer, default=1)
    status = Column(Enum(ConsumptionStatus), default=ConsumptionStatus.PENDING, index=True)
    attendance = Column(Enum(AttendanceStatus), default=AttendanceStatus.PRESENT)
    sign_in_time = Column(DateTime)
    sign_out_time = Column(DateTime)
    confirmed_by = Column(Integer, ForeignKey("users.id"))
    confirmed_at = Column(DateTime)
    remark = Column(Text)
    parent_verified = Column(Boolean, default=False)
    parent_verified_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    schedule = relationship("CourseSchedule", back_populates="consumptions")
    student = relationship("Student", back_populates="consumptions")
