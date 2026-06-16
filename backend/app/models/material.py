from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class MaterialCategory(Base):
    __tablename__ = "material_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    materials = relationship("Material", back_populates="category")


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(100), unique=True, nullable=False, index=True)
    specification = Column(String(500), nullable=False)
    unit = Column(String(20), nullable=False)
    category_id = Column(Integer, ForeignKey("material_categories.id"))
    brand = Column(String(100))
    model = Column(String(100))
    description = Column(Text)
    min_stock = Column(Float, default=0)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    category = relationship("MaterialCategory", back_populates="materials")
    monthly_usages = relationship("MonthlyUsage", back_populates="material")
    quotes = relationship("Quote", back_populates="material")


class MonthlyUsage(Base):
    __tablename__ = "monthly_usages"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    quantity = Column(Float, nullable=False)
    department = Column(String(100))
    remarks = Column(Text)
    recorded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    material = relationship("Material", back_populates="monthly_usages")
