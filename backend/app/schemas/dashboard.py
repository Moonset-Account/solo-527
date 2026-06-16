from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class DashboardRecordBase(BaseModel):
    record_date: date
    total_purchase_amount: float = 0
    monthly_purchase_amount: float = 0
    total_orders_count: int = 0
    monthly_orders_count: int = 0
    pending_approval_count: int = 0
    pending_delivery_count: int = 0
    overdue_orders_count: int = 0
    avg_price_variance: float = 0
    cost_saving_amount: float = 0
    high_risk_supplier_count: int = 0
    active_agreements_count: int = 0
    department: Optional[str] = None
    category_id: Optional[int] = None


class DashboardRecordCreate(DashboardRecordBase):
    pass


class DashboardRecordInDB(DashboardRecordBase):
    id: int
    updated_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    total_purchase_amount: float
    monthly_purchase_amount: float
    total_orders_count: int
    monthly_orders_count: int
    pending_approval_count: int
    pending_delivery_count: int
    overdue_orders_count: int
    avg_price_variance: float
    cost_saving_amount: float
    high_risk_supplier_count: int
    active_agreements_count: int


class MonthlyPurchaseTrend(BaseModel):
    month: str
    amount: float
    order_count: int


class CategoryPurchaseStats(BaseModel):
    category_id: Optional[int]
    category_name: str
    amount: float
    percentage: float
