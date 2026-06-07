from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class RecycleRecordBase(BaseModel):
    record_no: str = Field(..., max_length=50)
    isbn: str = Field(..., max_length=20)
    condition: str = Field(..., max_length=20)
    recycle_price: float
    logistics_cost: float = 0
    other_cost: float = 0
    total_cost: float
    channel: str = Field(..., max_length=20)
    operator: Optional[str] = Field(None, max_length=50)
    recycle_date: datetime
    in_stock_date: Optional[datetime] = None
    sale_date: Optional[datetime] = None
    is_sold: bool = False
    sale_price: Optional[float] = None
    days_in_stock: int = 0
    is_abnormal: bool = False
    abnormal_reason: Optional[str] = Field(None, max_length=200)
    pricing_version: Optional[str] = Field(None, max_length=50)


class RecycleRecordCreate(RecycleRecordBase):
    book_id: int


class RecycleRecordUpdate(BaseModel):
    condition: Optional[str] = None
    recycle_price: Optional[float] = None
    logistics_cost: Optional[float] = None
    other_cost: Optional[float] = None
    total_cost: Optional[float] = None
    channel: Optional[str] = None
    is_sold: Optional[bool] = None
    sale_price: Optional[float] = None
    sale_date: Optional[datetime] = None
    days_in_stock: Optional[int] = None
    is_abnormal: Optional[bool] = None
    abnormal_reason: Optional[str] = None


class RecycleRecord(RecycleRecordBase):
    id: int
    book_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PriceScatterData(BaseModel):
    isbn: str
    title: str
    condition: str
    recycle_price: float
    suggested_price: Optional[float]
    sale_price: Optional[float]
    channel: str
    days_in_stock: int
    is_abnormal: bool
    is_set: bool
    record_no: str
    profit_margin: Optional[float]


class BookAnalysisData(BaseModel):
    isbn: str
    title: str
    condition: str
    avg_recycle_price: float
    avg_sale_price: Optional[float]
    avg_profit_margin: Optional[float]
    avg_days_in_stock: float
    total_count: int
    sold_count: int
    unsold_count: int
    turnover_rate: float
    avg_logistics_cost: float
    channels: List[str]


class FilterParams(BaseModel):
    channels: Optional[List[str]] = None
    conditions: Optional[List[str]] = None
    min_days_in_stock: Optional[int] = None
    max_days_in_stock: Optional[int] = None
    min_recycle_price: Optional[float] = None
    max_recycle_price: Optional[float] = None
    only_abnormal: bool = False
    only_unsold: bool = False
    isbn_keyword: Optional[str] = None
    title_keyword: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    category: Optional[str] = None


class ExportParams(FilterParams):
    export_type: str = "excel"
    pricing_version: Optional[str] = None
