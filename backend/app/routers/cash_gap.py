import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.cash_gap import (
    CashGapForecastCreate,
    CashGapForecastListResponse,
    CashGapForecastResponse,
    CashGapForecastUpdate,
)
from app.services.cash_gap_service import CashGapService

router = APIRouter(prefix="/cash-gaps", tags=["Cash Gap"])


@router.get("/", response_model=CashGapForecastListResponse)
async def list_cash_gap_forecasts(
    period_start: Optional[date] = Query(None),
    period_end: Optional[date] = Query(None),
    gap_status: Optional[str] = Query(None),
    responsible_person: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    service = CashGapService(db)
    return await service.list_forecasts(
        period_start=period_start,
        period_end=period_end,
        gap_status=gap_status,
        responsible_person=responsible_person,
        page=page,
        page_size=page_size,
    )


@router.get("/dashboard")
async def get_cash_gap_dashboard(db: AsyncSession = Depends(get_db)):
    service = CashGapService(db)
    return await service.get_dashboard()


@router.get("/{forecast_id}", response_model=CashGapForecastResponse)
async def get_cash_gap_forecast(forecast_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = CashGapService(db)
    forecast = await service.get_forecast(forecast_id)
    if not forecast:
        raise HTTPException(status_code=404, detail="Cash gap forecast not found")
    return forecast


@router.post("/", response_model=CashGapForecastResponse, status_code=201)
async def create_cash_gap_forecast(data: CashGapForecastCreate, db: AsyncSession = Depends(get_db)):
    service = CashGapService(db)
    return await service.create_forecast(data)


@router.put("/{forecast_id}", response_model=CashGapForecastResponse)
async def update_cash_gap_forecast(
    forecast_id: uuid.UUID, data: CashGapForecastUpdate, db: AsyncSession = Depends(get_db)
):
    service = CashGapService(db)
    forecast = await service.update_forecast(forecast_id, data)
    if not forecast:
        raise HTTPException(status_code=404, detail="Cash gap forecast not found")
    return forecast
