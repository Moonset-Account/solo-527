from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, ForeignKey, Enum,
    Text, JSON
)
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class ClassStatus(str, enum.Enum):
    PREPARING = "preparing"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    SUSPENDED = "suspended"


class ClassGroup(Base):
    __tablename__ = "class_groups"

    id = Column(Integer, primary_key=True, index=True)
    class_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False, index=True)
    major = Column(String(50), index=True)
    class_type = Column(String(50))
    description = Column(Text)
    max_students = Column(Integer, default=20)
    current_students = Column(Integer, default=0)
    status = Column(Enum(ClassStatus), default=ClassStatus.PREPARING, index=True)
    campus_id = Column(Integer, ForeignKey("campuses.id"), nullable=False, index=True)
    head_teacher_id = Column(Integer, ForeignKey("users.id"), index=True)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    total_hours = Column(Integer, default=0)
    cover_image = Column(String(255))
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    campus = relationship("Campus", back_populates="classes")
    head_teacher = relationship("User", foreign_keys=[head_teacher_id])
    enrollments = relationship("ClassEnrollment", back_populates="class_group", cascade="all, delete-orphan")
    schedules = relationship("CourseSchedule", back_populates="class_group", cascade="all, delete-orphan")
    homeworks = relationship("Homework", back_populates="class_group")
    notifications = relationship("Notification", back_populates="class_group")


class ClassEnrollment(Base):
    __tablename__ = "class_enrollments"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("class_groups.id"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    enroll_date = Column(DateTime, default=datetime.utcnow)
    allocated_hours = Column(Integer, default=0)
    used_hours = Column(Integer, default=0)
    remaining_hours = Column(Integer, default=0)
    status = Column(String(20), default="enrolled")
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    class_group = relationship("ClassGroup", back_populates="enrollments")
    student = relationship("Student", back_populates="class_enrollments")
