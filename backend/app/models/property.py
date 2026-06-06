from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.core.database import Base


class PropertyStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    community = Column(String(100), nullable=False, index=True)
    building = Column(String(50))
    room_number = Column(String(50), nullable=False)
    address = Column(String(255))
    area = Column(Float, comment="面积(平方米)")
    bedroom_count = Column(Integer, default=1)
    bathroom_count = Column(Integer, default=1)
    status = Column(Enum(PropertyStatus), default=PropertyStatus.ACTIVE)
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    room_statuses = relationship("RoomStatus", back_populates="property", cascade="all, delete-orphan")
    cleaning_tasks = relationship("CleaningTask", back_populates="property", cascade="all, delete-orphan")
    maintenance_orders = relationship("MaintenanceOrder", back_populates="property", cascade="all, delete-orphan")
