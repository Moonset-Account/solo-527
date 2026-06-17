from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, Boolean, ForeignKey, Enum, Date,
    Time, Float, Text, JSON, BigInteger
)
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    PRINCIPAL = "principal"
    TEACHER = "teacher"
    PARENT = "parent"
    OPERATOR = "operator"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    real_name = Column(String(50), nullable=False)
    phone = Column(String(20), index=True)
    email = Column(String(100))
    avatar = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.TEACHER, nullable=False, index=True)
    campus_id = Column(Integer, ForeignKey("campuses.id"))
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    campus = relationship("Campus", back_populates="users")
    managed_students = relationship("Student", foreign_keys="Student.teacher_id", back_populates="teacher")
    parent_children = relationship("StudentParent", back_populates="parent", cascade="all, delete-orphan")
    created_reminders = relationship("Reminder", foreign_keys="Reminder.creator_id", back_populates="creator")
    history_records = relationship("HistoryRecord", back_populates="operator")


class Campus(Base):
    __tablename__ = "campuses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    address = Column(String(255))
    contact_person = Column(String(50))
    contact_phone = Column(String(20))
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="campus")
    students = relationship("Student", back_populates="campus")
    classes = relationship("ClassGroup", back_populates="campus")
