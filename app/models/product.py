from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class PointProduct(Base):
    __tablename__ = "point_products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    sku = Column(String(100), unique=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    category = Column(String(100))
    points_required = Column(Integer, nullable=False)
    original_price = Column(Float, default=0.0)
    cost_price = Column(Float, default=0.0)
    description = Column(Text)
    images = Column(JSON, default=list)
    specs = Column(JSON, default=list)
    stock = Column(Integer, default=0)
    total_exchanged = Column(Integer, default=0)
    per_user_limit = Column(Integer, default=1)
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    is_hot = Column(Boolean, default=False)
    is_new = Column(Boolean, default=False)
    version = Column(Integer, default=1)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    redemptions = relationship("RedemptionOrder", back_populates="product")
    versions = relationship("PointProductVersion", back_populates="product")
    attachments = relationship("Attachment", primaryjoin="and_(foreign(Attachment.entity_type)=='point_product', foreign(Attachment.entity_id)==PointProduct.id)")


class PointProductVersion(Base):
    __tablename__ = "point_product_versions"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("point_products.id"), nullable=False)
    version = Column(Integer, nullable=False)
    name = Column(String(200))
    data = Column(JSON, nullable=False)
    change_summary = Column(Text)
    changed_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("PointProduct", back_populates="versions")


class RedemptionOrder(Base):
    __tablename__ = "redemption_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String(100), unique=True, index=True, nullable=False)
    member_id = Column(Integer, ForeignKey("member_profiles.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("point_products.id"), nullable=False)
    quantity = Column(Integer, default=1)
    points_consumed = Column(Integer, nullable=False)
    cost_amount = Column(Float, default=0.0)
    status = Column(String(20), default="pending")
    receiver_name = Column(String(100))
    receiver_phone = Column(String(20))
    receiver_address = Column(String(500))
    logistics_company = Column(String(100))
    tracking_no = Column(String(100))
    remark = Column(Text)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    submitted_at = Column(DateTime)
    processed_at = Column(DateTime)
    shipped_at = Column(DateTime)
    completed_at = Column(DateTime)
    cancelled_at = Column(DateTime)
    cancel_reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    member = relationship("MemberProfile", back_populates="redemptions")
    product = relationship("PointProduct", back_populates="redemptions")
    items = relationship("RedemptionOrderItem", back_populates="order")
    attachments = relationship("Attachment", primaryjoin="and_(foreign(Attachment.entity_type)=='redemption_order', foreign(Attachment.entity_id)==RedemptionOrder.id)")
    notes = relationship("Note", primaryjoin="and_(foreign(Note.entity_type)=='redemption_order', foreign(Note.entity_id)==RedemptionOrder.id)")
    history = relationship("ChangeHistory", primaryjoin="and_(foreign(ChangeHistory.entity_type)=='redemption_order', foreign(ChangeHistory.entity_id)==RedemptionOrder.id)")


class RedemptionOrderItem(Base):
    __tablename__ = "redemption_order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("redemption_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("point_products.id"), nullable=False)
    product_name = Column(String(200))
    product_image = Column(String(500))
    points_per_unit = Column(Integer, nullable=False)
    quantity = Column(Integer, default=1)
    points_total = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("RedemptionOrder", back_populates="items")
