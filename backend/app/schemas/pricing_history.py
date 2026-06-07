from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PricingHistoryBase(BaseModel):
    isbn: str = Field(..., max_length=20)
    condition: str = Field(..., max_length=20)
    old_price: float
    new_price: float
    price_change: float
    change_percent: Optional[float] = None
    operator: str = Field(..., max_length=50)
    change_reason: Optional[str] = None
    effective_date: datetime
    version: str = Field(..., max_length=50)


class PricingHistoryCreate(PricingHistoryBase):
    book_id: int


class PricingHistory(PricingHistoryBase):
    id: int
    book_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class SaleStats(BaseModel):
    period: str
    avg_sale_price: Optional[float]
    total_sales: int
    avg_days_in_stock: Optional[float]
    profit_margin: Optional[float]


class PriceComparison(BaseModel):
    isbn: str
    title: str
    condition: str
    
    before_price: float
    after_price: float
    price_change: float
    change_percent: float
    
    before_stats: SaleStats
    after_stats: SaleStats
    
    operator: str
    change_reason: Optional[str]
    effective_date: datetime
    version: str
