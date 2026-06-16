import uuid
from datetime import date
from decimal import Decimal
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.cash_gap import (
    CashGapForecastCreate,
    CashGapForecastListResponse,
    CashGapForecastResponse,
    CashGapForecastUpdate,
)


class CashGapService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_forecasts(
        self,
        period_start: Optional[date] = None,
        period_end: Optional[date] = None,
        gap_status: Optional[str] = None,
        responsible_person: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> CashGapForecastListResponse:
        from app.models.cash_gap import CashGapForecast

        query = select(CashGapForecast)
        count_query = select(func.count()).select_from(CashGapForecast)

        if period_start:
            query = query.where(CashGapForecast.period_start >= period_start)
            count_query = count_query.where(CashGapForecast.period_start >= period_start)
        if period_end:
            query = query.where(CashGapForecast.period_end <= period_end)
            count_query = count_query.where(CashGapForecast.period_end <= period_end)
        if gap_status:
            query = query.where(CashGapForecast.gap_status == gap_status)
            count_query = count_query.where(CashGapForecast.gap_status == gap_status)
        if responsible_person:
            query = query.where(CashGapForecast.responsible_person.ilike(f"%{responsible_person}%"))
            count_query = count_query.where(CashGapForecast.responsible_person.ilike(f"%{responsible_person}%"))

        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(CashGapForecast.created_at.desc())

        result = await self.db.execute(query)
        forecasts = result.scalars().all()

        items = [CashGapForecastResponse.model_validate(f) for f in forecasts]
        return CashGapForecastListResponse(items=items, total=total, page=page, page_size=page_size)

    async def get_forecast(self, forecast_id: uuid.UUID) -> Optional[CashGapForecastResponse]:
        from app.models.cash_gap import CashGapForecast

        result = await self.db.execute(select(CashGapForecast).where(CashGapForecast.id == forecast_id))
        forecast = result.scalar_one_or_none()
        if not forecast:
            return None
        return CashGapForecastResponse.model_validate(forecast)

    async def create_forecast(self, data: CashGapForecastCreate) -> CashGapForecastResponse:
        from app.models.cash_gap import CashGapForecast

        forecast = CashGapForecast(**data.model_dump())
        self.db.add(forecast)
        await self.db.commit()
        await self.db.refresh(forecast)
        return CashGapForecastResponse.model_validate(forecast)

    async def update_forecast(
        self, forecast_id: uuid.UUID, data: CashGapForecastUpdate
    ) -> Optional[CashGapForecastResponse]:
        from app.models.cash_gap import CashGapForecast

        result = await self.db.execute(select(CashGapForecast).where(CashGapForecast.id == forecast_id))
        forecast = result.scalar_one_or_none()
        if not forecast:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(forecast, key, value)

        await self.db.commit()
        await self.db.refresh(forecast)
        return CashGapForecastResponse.model_validate(forecast)

    async def get_dashboard(self) -> dict:
        from app.models.cash_gap import CashGapForecast

        result = await self.db.execute(
            select(CashGapForecast).order_by(CashGapForecast.forecast_date.desc()).limit(30)
        )
        forecasts = result.scalars().all()

        total_inflow = sum(f.expected_inflow for f in forecasts)
        total_outflow = sum(f.expected_outflow for f in forecasts)
        total_gap = sum(f.gap_amount for f in forecasts)

        gap_status_count = {}
        for f in forecasts:
            status_val = f.gap_status.value if hasattr(f.gap_status, "value") else str(f.gap_status)
            gap_status_count[status_val] = gap_status_count.get(status_val, 0) + 1

        trend = [
            {
                "forecast_date": str(f.forecast_date),
                "expected_inflow": float(f.expected_inflow),
                "expected_outflow": float(f.expected_outflow),
                "gap_amount": float(f.gap_amount),
            }
            for f in forecasts
        ]

        return {
            "total_inflow": float(total_inflow),
            "total_outflow": float(total_outflow),
            "total_gap": float(total_gap),
            "gap_status_count": gap_status_count,
            "trend": trend,
        }
