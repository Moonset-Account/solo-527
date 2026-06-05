from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, Float, Date, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum
from ..database import Base


class RequisitionStatus(PyEnum):
    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PICKED_UP = "picked_up"
    RETURNED = "returned"
    CANCELLED = "cancelled"


class Requisition(Base):
    __tablename__ = "requisitions"

    id = Column(Integer, primary_key=True, index=True)
    requisition_number = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    applicant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    purpose = Column(String(500))
    status = Column(Enum(RequisitionStatus), default=RequisitionStatus.DRAFT, nullable=False)
    priority = Column(String(20), default="normal")
    first_confirmer_id = Column(Integer, ForeignKey("users.id"))
    first_confirmed_at = Column(DateTime(timezone=True))
    second_confirmer_id = Column(Integer, ForeignKey("users.id"))
    second_confirmed_at = Column(DateTime(timezone=True))
    requires_double_confirm = Column(Boolean, default=False, nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime(timezone=True))
    rejection_reason = Column(String(500))
    picked_up_by = Column(Integer, ForeignKey("users.id"))
    picked_up_at = Column(DateTime(timezone=True))
    returned_at = Column(DateTime(timezone=True))
    expected_return_date = Column(Date)
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    applicant = relationship("User", foreign_keys=[applicant_id])
    first_confirmer = relationship("User", foreign_keys=[first_confirmer_id])
    second_confirmer = relationship("User", foreign_keys=[second_confirmer_id])
    approver = relationship("User", foreign_keys=[approver_id])
    items = relationship("RequisitionItem", back_populates="requisition", cascade="all, delete-orphan")


class RequisitionItem(Base):
    __tablename__ = "requisition_items"

    id = Column(Integer, primary_key=True, index=True)
    requisition_id = Column(Integer, ForeignKey("requisitions.id"), nullable=False)
    reagent_batch_id = Column(Integer, ForeignKey("reagent_batches.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    returned_quantity = Column(Float, default=0)
    purpose = Column(String(500))
    remarks = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    requisition = relationship("Requisition", back_populates="items")
    reagent_batch = relationship("ReagentBatch")
