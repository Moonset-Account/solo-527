from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text,
    ForeignKey, UniqueConstraint, Index, DECIMAL, BigInteger
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    real_name = Column(String(100), nullable=False)
    email = Column(String(100))
    phone = Column(String(20))
    role = Column(String(20), nullable=False, index=True)
    is_test_account = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login_at = Column(DateTime(timezone=True))

    orders = relationship("Order", back_populates="photographer", foreign_keys="Order.photographer_id")
    operated_nodes = relationship("DeliveryNode", back_populates="operator", foreign_keys="DeliveryNode.operator_id")
    assigned_exceptions = relationship("ExceptionTicket", back_populates="assignee", foreign_keys="ExceptionTicket.assignee_id")
    resolved_exceptions = relationship("ExceptionTicket", back_populates="resolver", foreign_keys="ExceptionTicket.resolved_by")
    satisfactions = relationship("Satisfaction", back_populates="rater", foreign_keys="Satisfaction.rated_by")
    exception_logs = relationship("ExceptionLog", back_populates="operator")
    approved_authorizations = relationship("MaterialAuthorization", back_populates="approver")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(32), unique=True, nullable=False, index=True)
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(20), nullable=False)
    photographer_id = Column(Integer, ForeignKey("users.id"), index=True)
    shoot_type = Column(String(50), nullable=False)
    shoot_date = Column(DateTime(timezone=True), nullable=False, index=True)
    total_amount = Column(DECIMAL(10, 2), nullable=False, default=0)
    prepaid_amount = Column(DECIMAL(10, 2), nullable=False, default=0)
    photo_count = Column(Integer, nullable=False, default=0)
    selected_count = Column(Integer, nullable=False, default=0)
    delivered_count = Column(Integer, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="pending", index=True)
    remark = Column(Text)
    is_test_data = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    photographer = relationship("User", back_populates="orders", foreign_keys=[photographer_id])
    delivery_nodes = relationship("DeliveryNode", back_populates="order", cascade="all, delete-orphan")
    photo_selections = relationship("PhotoSelection", back_populates="order", cascade="all, delete-orphan")
    delivery_files = relationship("DeliveryFile", back_populates="order", cascade="all, delete-orphan")
    exception_tickets = relationship("ExceptionTicket", back_populates="order")
    satisfaction = relationship("Satisfaction", back_populates="order", uselist=False)
    invoice = relationship("Invoice", back_populates="order", uselist=False)
    material_authorizations = relationship("MaterialAuthorization", back_populates="order")


class DeliveryNode(Base):
    __tablename__ = "delivery_nodes"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    node_type = Column(String(30), nullable=False, index=True)
    node_name = Column(String(100), nullable=False)
    expected_at = Column(DateTime(timezone=True), nullable=False)
    actual_at = Column(DateTime(timezone=True))
    is_completed = Column(Boolean, default=False, index=True)
    operator_id = Column(Integer, ForeignKey("users.id"), index=True)
    remark = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="delivery_nodes")
    operator = relationship("User", back_populates="operated_nodes")


class PhotoSelection(Base):
    __tablename__ = "photo_selections"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    photo_key = Column(String(100), nullable=False)
    thumbnail_url = Column(String(500), nullable=False)
    original_url = Column(String(500), nullable=False)
    is_selected = Column(Boolean, default=False, index=True)
    selection_note = Column(Text)
    selected_at = Column(DateTime(timezone=True))
    selected_by = Column(Integer, ForeignKey("users.id"), index=True)

    order = relationship("Order", back_populates="photo_selections")

    __table_args__ = (
        UniqueConstraint("order_id", "photo_key", name="uq_order_photo"),
    )


class DeliveryFile(Base):
    __tablename__ = "delivery_files"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    file_type = Column(String(50), nullable=False)
    is_downloaded = Column(Boolean, default=False, index=True)
    download_count = Column(Integer, default=0)
    last_downloaded_at = Column(DateTime(timezone=True))
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="delivery_files")


class ExceptionTicket(Base):
    __tablename__ = "exception_tickets"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), index=True)
    exception_type = Column(String(30), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    amount_diff = Column(DECIMAL(10, 2), default=0)
    status = Column(String(20), nullable=False, default="pending", index=True)
    assignee_id = Column(Integer, ForeignKey("users.id"), index=True)
    resolution = Column(Text)
    resolved_at = Column(DateTime(timezone=True))
    resolved_by = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    order = relationship("Order", back_populates="exception_tickets")
    assignee = relationship("User", back_populates="assigned_exceptions", foreign_keys=[assignee_id])
    resolver = relationship("User", back_populates="resolved_exceptions", foreign_keys=[resolved_by])
    logs = relationship("ExceptionLog", back_populates="ticket", cascade="all, delete-orphan")


class ExceptionLog(Base):
    __tablename__ = "exception_logs"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("exception_tickets.id", ondelete="CASCADE"), index=True)
    action = Column(String(50), nullable=False)
    remark = Column(Text)
    operator_id = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ticket = relationship("ExceptionTicket", back_populates="logs")
    operator = relationship("User", back_populates="exception_logs")


class Satisfaction(Base):
    __tablename__ = "satisfactions"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    rating = Column(Integer, nullable=False, index=True)
    feedback = Column(Text)
    rated_by = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    order = relationship("Order", back_populates="satisfaction")
    rater = relationship("User", back_populates="satisfactions")

    __table_args__ = (
        UniqueConstraint("order_id", name="uq_order_satisfaction"),
    )


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), index=True)
    invoice_no = Column(String(50), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    invoice_date = Column(DateTime(timezone=True), nullable=False, index=True)
    status = Column(String(20), nullable=False, index=True)
    is_received = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="invoice")


class MaterialAuthorization(Base):
    __tablename__ = "material_authorizations"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), index=True)
    material_type = Column(String(50), nullable=False)
    scope = Column(Text, nullable=False)
    valid_from = Column(DateTime(timezone=True), nullable=False)
    valid_to = Column(DateTime(timezone=True), nullable=False)
    is_approved = Column(Boolean, default=False, index=True)
    approved_at = Column(DateTime(timezone=True))
    approved_by = Column(Integer, ForeignKey("users.id"), index=True)

    order = relationship("Order", back_populates="material_authorizations")
    approver = relationship("User", back_populates="approved_authorizations")
