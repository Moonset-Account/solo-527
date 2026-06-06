from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    sku = Column(String(50), unique=True, index=True)
    category = Column(String(50), index=True)
    unit = Column(String(20), nullable=False)
    unit_price = Column(Float, default=0.0)
    stock_quantity = Column(Float, default=0.0)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    usages = relationship("MaterialUsage", back_populates="material")


class MaterialUsage(Base):
    __tablename__ = "material_usages"

    id = Column(Integer, primary_key=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    cleaning_task_id = Column(Integer, ForeignKey("cleaning_tasks.id"))
    maintenance_order_id = Column(Integer, ForeignKey("maintenance_orders.id"))
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    remarks = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    material = relationship("Material", back_populates="usages")
    cleaning_task = relationship("CleaningTask", back_populates="material_usages")
    maintenance_order = relationship("MaintenanceOrder", back_populates="material_usages")
