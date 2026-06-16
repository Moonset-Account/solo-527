import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field


class CashGapForecastBase(BaseModel):
    forecast_date: date
    period_start: date
    period_end: date
    expected_inflow: Decimal = Field(default=Decimal("0"), ge=0)
    expected_outflow: Decimal = Field(default=Decimal("0"), ge=0)
    gap_amount: Decimal = Field(default=Decimal("0"))
    gap_status: str = Field(default="safe", max_length=30)
    responsible_person: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class CashGapForecastCreate(CashGapForecastBase):
    pass


class CashGapForecastUpdate(BaseModel):
    forecast_date: Optional[date] = None
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    expected_inflow: Optional[Decimal] = Field(None, ge=0)
    expected_outflow: Optional[Decimal] = Field(None, ge=0)
    gap_amount: Optional[Decimal] = None
    gap_status: Optional[str] = Field(None, max_length=30)
    responsible_person: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class CashGapForecastResponse(CashGapForecastBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CashGapForecastListResponse(BaseModel):
    items: list[CashGapForecastResponse]
    total: int
    page: int
    page_size: int
