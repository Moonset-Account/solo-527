from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text, Float, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    CLEANER = "cleaner"
    MAINTENANCE = "maintenance"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    phone = Column(String(20))
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CLEANER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    assigned_cleaning_tasks = relationship("CleaningTask", back_populates="cleaner", foreign_keys="CleaningTask.cleaner_id")
    assigned_maintenance_orders = relationship("MaintenanceOrder", back_populates="technician", foreign_keys="MaintenanceOrder.technician_id")
    created_tasks = relationship("CleaningTask", back_populates="creator", foreign_keys="CleaningTask.created_by")
    created_orders = relationship("MaintenanceOrder", back_populates="creator", foreign_keys="MaintenanceOrder.created_by")
