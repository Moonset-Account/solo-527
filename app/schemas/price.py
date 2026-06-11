from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime
from decimal import Decimal


class PriceRecordBase(BaseModel):
    material_name: str = Field(..., max_length=200)
    specification: Optional[str] = Field(None, max_length=500)
    price: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)
    supplier_id: Optional[int] = None
    purchase_id: Optional[int] = None
    record_date: date
    expires_at: Optional[date] = None


class PriceRecordCreate(PriceRecordBase):
    pass


class PriceRecordUpdate(BaseModel):
    price: Optional[Decimal] = None
    expires_at: Optional[date] = None
    is_expired: Optional[bool] = None


class PriceRecordResponse(PriceRecordBase):
    id: int
    is_expired: bool
    supplier_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PriceHistoryQuery(BaseModel):
    material_name: Optional[str] = None
    specification: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class PriceStats(BaseModel):
    material_name: str
    specification: str
    avg_price: Decimal
    min_price: Decimal
    max_price: Decimal
    current_price: Decimal
    price_change: Decimal
    change_percent: Decimal
