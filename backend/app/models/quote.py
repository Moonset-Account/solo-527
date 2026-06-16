from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Boolean, Enum, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import enum


class QuoteStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    EVALUATED = "evaluated"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"


class Quote(Base):
    __tablename__ = "quotes"

    id = Column(Integer, primary_key=True, index=True)
    quote_no = Column(String(50), unique=True, nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    unit_price = Column(Float, nullable=False)
    min_order_qty = Column(Float, default=1)
    delivery_days = Column(Integer)
    payment_terms = Column(String(200))
    warranty_period = Column(String(50))
    valid_from = Column(Date)
    valid_to = Column(Date)
    tax_rate = Column(Float, default=13.0)
    status = Column(Enum(QuoteStatus), default=QuoteStatus.DRAFT)
    remarks = Column(Text)
    attachment_url = Column(String(500))
    submitted_by = Column(Integer, ForeignKey("users.id"))
    evaluated_by = Column(Integer, ForeignKey("users.id"))
    evaluation_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    material = relationship("Material", back_populates="quotes")
    supplier = relationship("Supplier", back_populates="quotes")
    comparisons = relationship("QuoteComparison", back_populates="quote")


class QuoteComparison(Base):
    __tablename__ = "quote_comparisons"

    id = Column(Integer, primary_key=True, index=True)
    comparison_no = Column(String(50), unique=True, nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quote_id = Column(Integer, ForeignKey("quotes.id"), nullable=False)
    historical_avg_price = Column(Float)
    historical_min_price = Column(Float)
    historical_max_price = Column(Float)
    price_variance = Column(Float)
    price_variance_percent = Column(Float)
    rank_by_price = Column(Integer)
    is_lowest = Column(Boolean, default=False)
    is_within_agreement = Column(Boolean, default=False)
    agreement_price = Column(Float)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    quote = relationship("Quote", back_populates="comparisons")
