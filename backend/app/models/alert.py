from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Enum
from sqlalchemy.sql import func
from ..database import Base
import enum


class AlertType(str, enum.Enum):
    DELIVERY_DELAY = "delivery_delay"
    DELIVERY_DATE_CHANGE = "delivery_date_change"
    QUOTE_EXPIRING = "quote_expiring"
    AGREEMENT_EXPIRING = "agreement_expiring"
    SUPPLIER_RISK = "supplier_risk"
    STOCK_LOW = "stock_low"
    PRICE_ABNORMAL = "price_abnormal"


class NotificationStatus(str, enum.Enum):
    UNREAD = "unread"
    READ = "read"
    ARCHIVED = "archived"


class DeliveryAlert(Base):
    __tablename__ = "delivery_alerts"

    id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    po_no = Column(String(50), nullable=False)
    old_expected_date = Column(DateTime(timezone=True))
    new_expected_date = Column(DateTime(timezone=True))
    project_owner_id = Column(Integer, ForeignKey("users.id"))
    reason = Column(Text)
    is_resolved = Column(Boolean, default=False)
    resolved_by = Column(Integer, ForeignKey("users.id"))
    resolved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    alert_type = Column(Enum(AlertType), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text)
    related_entity_type = Column(String(50))
    related_entity_id = Column(Integer)
    status = Column(Enum(NotificationStatus), default=NotificationStatus.UNREAD)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True))
