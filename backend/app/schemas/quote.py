from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from ..models.quote import QuoteStatus


class QuoteBase(BaseModel):
    material_id: int
    supplier_id: int
    unit_price: float
    min_order_qty: Optional[float] = 1
    delivery_days: Optional[int] = None
    payment_terms: Optional[str] = None
    warranty_period: Optional[str] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    tax_rate: Optional[float] = 13.0
    remarks: Optional[str] = None
    attachment_url: Optional[str] = None


class QuoteCreate(QuoteBase):
    pass


class QuoteUpdate(BaseModel):
    unit_price: Optional[float] = None
    min_order_qty: Optional[float] = None
    delivery_days: Optional[int] = None
    payment_terms: Optional[str] = None
    warranty_period: Optional[str] = None
    valid_from: Optional[date] = None
    valid_to: Optional[date] = None
    tax_rate: Optional[float] = None
    status: Optional[QuoteStatus] = None
    remarks: Optional[str] = None
    evaluation_notes: Optional[str] = None


class QuoteInDB(QuoteBase):
    id: int
    quote_no: str
    status: QuoteStatus
    submitted_by: Optional[int] = None
    evaluated_by: Optional[int] = None
    evaluation_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class QuoteComparisonInDB(BaseModel):
    id: int
    comparison_no: str
    material_id: int
    quote_id: int
    historical_avg_price: Optional[float] = None
    historical_min_price: Optional[float] = None
    historical_max_price: Optional[float] = None
    price_variance: Optional[float] = None
    price_variance_percent: Optional[float] = None
    rank_by_price: Optional[int] = None
    is_lowest: bool
    is_within_agreement: bool
    agreement_price: Optional[float] = None
    created_by: Optional[int] = None
    created_at: datetime
    quote: Optional[QuoteInDB] = None

    class Config:
        from_attributes = True


class QuoteComparisonResult(BaseModel):
    material_id: int
    material_name: str
    material_code: str
    quotes: List[QuoteComparisonInDB]
    historical_avg_price: float
    historical_min_price: float
    historical_max_price: float
    lowest_price: float
    lowest_supplier: str
    agreement_price: Optional[float] = None
