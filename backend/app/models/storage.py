from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from ..database import Base


class CabinetType(PyEnum):
    GENERAL = "general"
    FLAMMABLE = "flammable"
    CORROSIVE = "corrosive"
    TOXIC = "toxic"
    REFRIGERATOR = "refrigerator"
    FREEZER = "freezer"


class StorageCabinet(Base):
    __tablename__ = "storage_cabinets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    type = Column(Enum(CabinetType), default=CabinetType.GENERAL, nullable=False)
    location = Column(String(200), nullable=False)
    description = Column(String(500))
    capacity = Column(Integer)
    temperature_min = Column(Integer)
    temperature_max = Column(Integer)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))
