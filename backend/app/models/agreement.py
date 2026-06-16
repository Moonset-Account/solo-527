from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Boolean, Enum, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import enum


class AgreementStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"


class FrameworkAgreement(Base):
    __tablename__ = "framework_agreements"

    id = Column(Integer, primary_key=True, index=True)
    agreement_no = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    effective_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    total_estimated_amount = Column(Float, default=0)
    used_amount = Column(Float, default=0)
    remaining_amount = Column(Float, default=0)
    payment_terms = Column(String(200))
    delivery_terms = Column(String(500))
    status = Column(Enum(AgreementStatus), default=AgreementStatus.DRAFT)
    attachment_url = Column(String(500))
    remarks = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    supplier = relationship("Supplier", back_populates="agreements")
    items = relationship("AgreementItem", back_populates="agreement")


class AgreementItem(Base):
    __tablename__ = "agreement_items"

    id = Column(Integer, primary_key=True, index=True)
    agreement_id = Column(Integer, ForeignKey("framework_agreements.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    unit_price = Column(Float, nullable=False)
    min_order_qty = Column(Float, default=1)
    max_order_qty = Column(Float)
    delivery_days = Column(Integer)
    contracted_qty = Column(Float)
    ordered_qty = Column(Float, default=0)
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    agreement = relationship("FrameworkAgreement", back_populates="items")
