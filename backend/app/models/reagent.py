from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Float, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from ..database import Base


class HazardLevel(PyEnum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXTREME = "extreme"


class ReagentCategory(PyEnum):
    ACID = "acid"
    ALKALI = "alkali"
    ORGANIC = "organic"
    INORGANIC = "inorganic"
    BIOLOGICAL = "biological"
    RADIOACTIVE = "radioactive"
    OXIDIZER = "oxidizer"
    OTHER = "other"


class Reagent(Base):
    __tablename__ = "reagents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    english_name = Column(String(200))
    cas_number = Column(String(50), index=True)
    molecular_formula = Column(String(100))
    category = Column(Enum(ReagentCategory), default=ReagentCategory.OTHER, nullable=False)
    hazard_level = Column(Enum(HazardLevel), default=HazardLevel.NONE, nullable=False)
    specification = Column(String(100))
    manufacturer = Column(String(200))
    supplier = Column(String(200))
    unit = Column(String(20), nullable=False)
    min_stock = Column(Float, default=0)
    description = Column(String(1000))
    safety_notes = Column(String(1000))
    storage_conditions = Column(String(500))
    barcode = Column(String(100), unique=True, index=True)
    qr_code = Column(String(255))
    requires_double_confirm = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, ForeignKey("users.id"))

    batches = relationship("ReagentBatch", back_populates="reagent", cascade="all, delete-orphan")


class ReagentBatch(Base):
    __tablename__ = "reagent_batches"

    id = Column(Integer, primary_key=True, index=True)
    reagent_id = Column(Integer, ForeignKey("reagents.id"), nullable=False)
    batch_number = Column(String(100), nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    remaining_quantity = Column(Float, nullable=False)
    unit_price = Column(Float)
    production_date = Column(Date)
    expiry_date = Column(Date, index=True)
    storage_cabinet_id = Column(Integer, ForeignKey("storage_cabinets.id"))
    shelf_position = Column(String(50))
    received_date = Column(Date, server_default=func.current_date())
    received_by = Column(Integer, ForeignKey("users.id"))
    remarks = Column(String(500))
    barcode = Column(String(100), unique=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    reagent = relationship("Reagent", back_populates="batches")
    storage_cabinet = relationship("StorageCabinet")
