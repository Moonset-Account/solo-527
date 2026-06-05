from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Float, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from ..database import Base


class InventoryCheckStatus(PyEnum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class InventoryCheck(Base):
    __tablename__ = "inventory_checks"

    id = Column(Integer, primary_key=True, index=True)
    check_number = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    type = Column(String(50), default="full")
    status = Column(Enum(InventoryCheckStatus), default=InventoryCheckStatus.DRAFT, nullable=False)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    checked_by = Column(Integer, ForeignKey("users.id"))
    remarks = Column(Text)
    discrepancies_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", foreign_keys=[created_by])
    checker = relationship("User", foreign_keys=[checked_by])
    items = relationship("InventoryCheckItem", back_populates="inventory_check", cascade="all, delete-orphan")


class InventoryCheckItem(Base):
    __tablename__ = "inventory_check_items"

    id = Column(Integer, primary_key=True, index=True)
    inventory_check_id = Column(Integer, ForeignKey("inventory_checks.id"), nullable=False)
    reagent_batch_id = Column(Integer, ForeignKey("reagent_batches.id"), nullable=False)
    expected_quantity = Column(Float, nullable=False)
    actual_quantity = Column(Float)
    difference = Column(Float)
    is_matched = Column(Boolean, default=True)
    checked_by = Column(Integer, ForeignKey("users.id"))
    checked_at = Column(DateTime(timezone=True))
    remarks = Column(String(500))
    photo_url = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    inventory_check = relationship("InventoryCheck", back_populates="items")
    reagent_batch = relationship("ReagentBatch")
