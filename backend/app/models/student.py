from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, ForeignKey, Enum, Date,
    Text, JSON
)
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"


class StudentStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    GRADUATED = "graduated"
    WITHDRAWN = "withdrawn"


class ArtMajor(str, enum.Enum):
    FINE_ARTS = "fine_arts"
    MUSIC = "music"
    DANCE = "dance"
    BROADCAST = "broadcast"
    FILM = "film"
    DESIGN = "design"
    PERFORMANCE = "performance"
    OTHER = "other"


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    student_no = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(50), nullable=False, index=True)
    gender = Column(Enum(Gender))
    birthday = Column(Date)
    id_card = Column(String(20))
    phone = Column(String(20))
    address = Column(String(255))
    avatar = Column(String(255))
    school = Column(String(100))
    grade = Column(String(20))
    major = Column(Enum(ArtMajor), default=ArtMajor.FINE_ARTS, index=True)
    target_school = Column(String(100))
    enroll_date = Column(Date)
    status = Column(Enum(StudentStatus), default=StudentStatus.ACTIVE, index=True)
    total_hours = Column(Integer, default=0)
    remaining_hours = Column(Integer, default=0)
    consumed_hours = Column(Integer, default=0)
    campus_id = Column(Integer, ForeignKey("campuses.id"), index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), index=True)
    remark = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    campus = relationship("Campus", back_populates="students")
    teacher = relationship("User", back_populates="managed_students")
    parents = relationship("StudentParent", back_populates="student", cascade="all, delete-orphan")
    class_enrollments = relationship("ClassEnrollment", back_populates="student", cascade="all, delete-orphan")
    consumptions = relationship("CourseConsumption", back_populates="student")
    homeworks = relationship("HomeworkSubmission", back_populates="student")
    feedbacks = relationship("WorkFeedback", back_populates="student")
    attachments = relationship("Attachment", primaryjoin="and_(Attachment.entity_type=='student', foreign(Attachment.entity_id)==Student.id)")


class StudentParent(Base):
    __tablename__ = "student_parents"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    relationship = Column(String(20))
    is_primary = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="parents")
    parent = relationship("User", back_populates="parent_children")
