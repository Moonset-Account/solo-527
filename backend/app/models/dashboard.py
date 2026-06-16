from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Date
from sqlalchemy.sql import func
from ..database import Base


class DashboardRecord(Base):
    __tablename__ = "dashboard_records"

    id = Column(Integer, primary_key=True, index=True)
    record_date = Column(Date, nullable=False, index=True)
    total_purchase_amount = Column(Float, default=0)
    monthly_purchase_amount = Column(Float, default=0)
    total_orders_count = Column(Integer, default=0)
    monthly_orders_count = Column(Integer, default=0)
    pending_approval_count = Column(Integer, default=0)
    pending_delivery_count = Column(Integer, default=0)
    overdue_orders_count = Column(Integer, default=0)
    avg_price_variance = Column(Float, default=0)
    cost_saving_amount = Column(Float, default=0)
    high_risk_supplier_count = Column(Integer, default=0)
    active_agreements_count = Column(Integer, default=0)
    department = Column(String(100))
    category_id = Column(Integer, ForeignKey("material_categories.id"))
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
