from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text, Boolean, Enum, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import enum


class PurchaseRequestStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    INQUIRY = "inquiry"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PurchaseOrderStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    CONFIRMED = "confirmed"
    PARTIAL_DELIVERED = "partial_delivered"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class PurchaseRequest(Base):
    __tablename__ = "purchase_requests"

    id = Column(Integer, primary_key=True, index=True)
    pr_no = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    department = Column(String(100))
    project_name = Column(String(200))
    project_owner_id = Column(Integer, ForeignKey("users.id"))
    expected_date = Column(Date)
    urgency = Column(String(20), default="normal")
    total_estimated_amount = Column(Float, default=0)
    status = Column(Enum(PurchaseRequestStatus), default=PurchaseRequestStatus.DRAFT)
    remarks = Column(Text)
    selected_quote_id = Column(Integer, ForeignKey("quotes.id"))
    agreement_id = Column(Integer, ForeignKey("framework_agreements.id"))
    created_by = Column(Integer, ForeignKey("users.id"))
    approved_by = Column(Integer, ForeignKey("users.id"))
    approved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    items = relationship("PurchaseOrderItem", back_populates="purchase_request")
    orders = relationship("PurchaseOrder", back_populates="purchase_request")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_no = Column(String(50), unique=True, nullable=False, index=True)
    pr_id = Column(Integer, ForeignKey("purchase_requests.id"), nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    total_amount = Column(Float, default=0)
    tax_amount = Column(Float, default=0)
    grand_total = Column(Float, default=0)
    delivery_address = Column(String(500))
    expected_delivery_date = Column(Date)
    actual_delivery_date = Column(Date)
    delivery_days_actual = Column(Integer)
    payment_terms = Column(String(200))
    status = Column(Enum(PurchaseOrderStatus), default=PurchaseOrderStatus.PENDING)
    remarks = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    sent_at = Column(DateTime(timezone=True))
    confirmed_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    purchase_request = relationship("PurchaseRequest", back_populates="orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order")
    supplier = relationship("Supplier", back_populates="purchase_orders")


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"))
    pr_id = Column(Integer, ForeignKey("purchase_requests.id"))
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quote_id = Column(Integer, ForeignKey("quotes.id"))
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    tax_rate = Column(Float, default=13.0)
    tax_amount = Column(Float, default=0)
    total = Column(Float, nullable=False)
    delivered_qty = Column(Float, default=0)
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    purchase_request = relationship("PurchaseRequest", back_populates="items")
