from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(64), unique=True, index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=False)
    user_hash = Column(String(64), index=True)
    store_id = Column(Integer, index=True, nullable=False)
    store_name = Column(String(128))
    product_id = Column(Integer, index=True, nullable=False)
    product_name = Column(String(256))
    product_category = Column(String(128))
    sku = Column(String(128))
    quantity = Column(Integer, default=1)
    amount = Column(Numeric(12, 2), nullable=False)
    warehouse_id = Column(Integer, index=True)
    warehouse_name = Column(String(128))
    logistics_provider = Column(String(128))
    created_at = Column(DateTime, server_default=func.now())
    paid_at = Column(DateTime)
    shipped_at = Column(DateTime)
    delivered_at = Column(DateTime)

    return_requests = relationship("ReturnRequest", back_populates="order")


class ReturnRequest(Base):
    __tablename__ = "return_requests"

    id = Column(Integer, primary_key=True, index=True)
    return_no = Column(String(64), unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    order_no = Column(String(64), index=True)
    user_id = Column(Integer, index=True, nullable=False)
    user_hash = Column(String(64), index=True)
    return_reason_level1 = Column(String(128), index=True)
    return_reason_level2 = Column(String(128), index=True)
    return_reason_level3 = Column(String(128), index=True)
    return_amount = Column(Numeric(12, 2))
    return_quantity = Column(Integer, default=1)
    apply_time = Column(DateTime, server_default=func.now())
    status = Column(String(32), default="pending")

    order = relationship("Order", back_populates="return_requests")
    inspection = relationship("Inspection", back_populates="return_request", uselist=False)
    refund = relationship("Refund", back_populates="return_request", uselist=False)
    logistics = relationship("ReturnLogistics", back_populates="return_request", uselist=False)
    customer_service = relationship("CustomerService", back_populates="return_request", uselist=False)


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    return_request_id = Column(Integer, ForeignKey("return_requests.id"), unique=True, nullable=False)
    inspector = Column(String(64))
    inspect_time = Column(DateTime)
    inspect_result = Column(String(32))
    inspect_remark = Column(Text)
    damage_level = Column(String(32))
    is_quality_issue = Column(Boolean, default=False)

    return_request = relationship("ReturnRequest", back_populates="inspection")


class Refund(Base):
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, index=True)
    return_request_id = Column(Integer, ForeignKey("return_requests.id"), unique=True, nullable=False)
    refund_no = Column(String(64), unique=True, index=True)
    refund_amount = Column(Numeric(12, 2))
    refund_method = Column(String(64))
    apply_time = Column(DateTime)
    audit_time = Column(DateTime)
    refund_time = Column(DateTime)
    status = Column(String(32), default="pending")
    auditor = Column(String(64))

    return_request = relationship("ReturnRequest", back_populates="refund")


class ReturnLogistics(Base):
    __tablename__ = "return_logistics"

    id = Column(Integer, primary_key=True, index=True)
    return_request_id = Column(Integer, ForeignKey("return_requests.id"), unique=True, nullable=False)
    tracking_no = Column(String(128))
    logistics_provider = Column(String(128), index=True)
    shipped_at = Column(DateTime)
    received_at = Column(DateTime)
    status = Column(String(32), default="in_transit")
    warehouse_id = Column(Integer, index=True)
    warehouse_name = Column(String(128))

    return_request = relationship("ReturnRequest", back_populates="logistics")


class CustomerService(Base):
    __tablename__ = "customer_services"

    id = Column(Integer, primary_key=True, index=True)
    return_request_id = Column(Integer, ForeignKey("return_requests.id"), unique=True, nullable=False)
    agent_id = Column(Integer, index=True)
    agent_name = Column(String(128))
    first_response_time = Column(DateTime)
    resolved_time = Column(DateTime)
    handling_duration = Column(Float)
    communication_count = Column(Integer, default=0)
    notes = Column(Text)
    escalation_flag = Column(Boolean, default=False)
    satisfaction_score = Column(Integer)

    return_request = relationship("ReturnRequest", back_populates="customer_service")


class SavedView(Base):
    __tablename__ = "saved_views"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(256), nullable=False)
    user_id = Column(Integer, index=True)
    filters = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    is_public = Column(Boolean, default=False)
