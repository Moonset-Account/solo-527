from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, Float, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class OperationLog(Base):
    __tablename__ = "operation_logs"

    id = Column(Integer, primary_key=True, index=True)
    operator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(Integer)
    entity_name = Column(String(500))
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    old_data = Column(JSON)
    new_data = Column(JSON)
    change_summary = Column(Text)
    is_conflict_action = Column(Boolean, default=False)
    conflict_detail = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    operator = relationship("User", back_populates="operations")


class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer)
    file_type = Column(String(100))
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class ChangeHistory(Base):
    __tablename__ = "change_histories"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    field_name = Column(String(100))
    old_value = Column(JSON)
    new_value = Column(JSON)
    change_summary = Column(Text)
    changed_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)


class DictItem(Base):
    __tablename__ = "dict_items"

    id = Column(Integer, primary_key=True, index=True)
    dict_type = Column(String(100), nullable=False)
    dict_code = Column(String(100), nullable=False)
    dict_label = Column(String(200), nullable=False)
    dict_value = Column(JSON)
    sort_order = Column(Integer, default=0)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    version = Column(Integer, default=1)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    versions = relationship("DictItemVersion", back_populates="dict_item")

    __table_args__ = ()


class DictItemVersion(Base):
    __tablename__ = "dict_item_versions"

    id = Column(Integer, primary_key=True, index=True)
    dict_item_id = Column(Integer, ForeignKey("dict_items.id"), nullable=False)
    version = Column(Integer, nullable=False)
    dict_label = Column(String(200))
    data = Column(JSON, nullable=False)
    change_summary = Column(Text)
    changed_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    dict_item = relationship("DictItem", back_populates="versions")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    notification_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    target_user_id = Column(Integer, ForeignKey("users.id"))
    target_role = Column(String(50))
    entity_type = Column(String(50))
    entity_id = Column(Integer)
    priority = Column(String(20), default="normal")
    is_read = Column(Boolean, default=False)
    data = Column(JSON, default=dict)
    version = Column(Integer, default=1)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime)

    versions = relationship("NotificationVersion", back_populates="notification")


class NotificationVersion(Base):
    __tablename__ = "notification_versions"

    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.id"), nullable=False)
    version = Column(Integer, nullable=False)
    title = Column(String(200))
    data = Column(JSON, nullable=False)
    change_summary = Column(Text)
    changed_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    notification = relationship("Notification", back_populates="versions")


class CostReport(Base):
    __tablename__ = "cost_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(String(50), nullable=False)
    report_date = Column(String(20), nullable=False)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    total_points_cost = Column(Float, default=0.0)
    total_coupon_cost = Column(Float, default=0.0)
    total_benefit_cost = Column(Float, default=0.0)
    total_reach_cost = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    points_issued = Column(Integer, default=0)
    points_redeemed = Column(Integer, default=0)
    coupons_issued = Column(Integer, default=0)
    coupons_used = Column(Integer, default=0)
    redemptions_count = Column(Integer, default=0)
    reach_tasks_count = Column(Integer, default=0)
    members_reached = Column(Integer, default=0)
    data = Column(JSON, default=dict)
    generated_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
