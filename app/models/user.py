from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    BUYER = "buyer"
    AUDITOR = "auditor"
    MANAGER = "manager"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    real_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(20))
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
