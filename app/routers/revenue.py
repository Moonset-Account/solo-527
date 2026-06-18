import json
from typing import Annotated
from uuid import UUID
from datetime import date, datetime

from fastapi import APIRouter, Depends, Request, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.templating import Jinja2Templates

from app.database import get_db
from app.services import revenue_service, cache_service

templates = Jinja2Templates(directory="app/templates")

router = APIRouter(prefix="/revenue", tags=["revenue"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/")
async def revenue_page(
    request: Request,
    db: DbSession,
    station_id: UUID | None = Query(None),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
):
    context = {
        "request": request,
        "selected_station_id": station_id,
        "start_date": start_date,
        "end_date": end_date,
    }
    return templates.TemplateResponse("revenue.html", context)


@router.post("/calculate")
async def calculate_revenue(
    request: Request,
    db: DbSession,
    station_id: UUID = Form(...),
    record_date: date = Form(...),
    generation_kwh: float = Form(...),
    consumption_kwh: float = Form(...),
    grid_feed_kwh: float = Form(...),
    peak_load_kw: float = Form(None),
):
    record = await revenue_service.calculate_revenue(
        db,
        station_id=station_id,
        record_date=record_date,
        generation_kwh=generation_kwh,
        consumption_kwh=consumption_kwh,
        grid_feed_kwh=grid_feed_kwh,
        peak_load_kw=peak_load_kw,
    )
    await db.commit()
    await cache_service.invalidate_pattern(f"revenue:*")
    return templates.TemplateResponse(
        "partials/revenue_result.html", {"request": request, "record": record}
    )


@router.get("/records")
async def revenue_records(
    request: Request,
    db: DbSession,
    station_id: UUID = Query(...),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    skip: int = Query(0),
    limit: int = Query(50),
):
    records = await revenue_service.get_revenue_records(
        db, station_id=station_id, start_date=start_date, end_date=end_date, skip=skip, limit=limit
    )
    return templates.TemplateResponse(
        "partials/revenue_table.html",
        {"request": request, "records": records, "skip": skip, "limit": limit},
    )


@router.post("/batch-query")
async def batch_query(
    request: Request,
    db: DbSession,
    station_ids: str = Form(...),
    start_date: date = Form(...),
    end_date: date = Form(...),
):
    ids = [UUID(s.strip()) for s in station_ids.split(",") if s.strip()]
    records = await revenue_service.batch_query_revenue(db, station_ids=ids, start_date=start_date, end_date=end_date)
    return templates.TemplateResponse(
        "partials/revenue_table.html", {"request": request, "records": records, "skip": 0, "limit": len(records)}
    )


@router.get("/peak-load")
async def peak_load(
    request: Request,
    db: DbSession,
    station_id: UUID = Query(...),
    start_date: date = Query(...),
    end_date: date = Query(...),
):
    data = await revenue_service.get_peak_load_analysis(db, station_id, start_date, end_date)
    return templates.TemplateResponse(
        "partials/peak_load.html", {"request": request, "peak_data": data}
    )


@router.get("/energy-curve")
async def energy_curve(
    request: Request,
    db: DbSession,
    station_id: UUID = Query(...),
    start_time: datetime = Query(...),
    end_time: datetime = Query(...),
    interval_minutes: int = Query(15),
):
    data = await revenue_service.get_energy_curve(
        db, station_id=station_id, start_time=start_time, end_time=end_time, interval_minutes=interval_minutes
    )
    return templates.TemplateResponse(
        "partials/energy_curve.html", {"request": request, "curve_data": data}
    )


@router.post("/batch-energy")
async def batch_energy(
    request: Request,
    db: DbSession,
    station_ids: str = Form(...),
    start_time: datetime = Form(...),
    end_time: datetime = Form(...),
):
    ids = [UUID(s.strip()) for s in station_ids.split(",") if s.strip()]
    data = await revenue_service.batch_query_energy_curves(db, station_ids=ids, start_time=start_time, end_time=end_time)
    return templates.TemplateResponse(
        "partials/energy_curve.html", {"request": request, "curve_data": data}
    )


@router.get("/api/summary", tags=["api"])
async def api_revenue_summary(
    db: DbSession,
    station_id: UUID = Query(...),
    start_date: date = Query(...),
    end_date: date = Query(...),
):
    key = cache_service.revenue_summary_key(station_id, start_date, end_date)
    cached = await cache_service.get_cached(key)
    if cached:
        return json.loads(cached)
    summary = await revenue_service.get_revenue_summary(db, station_id, start_date, end_date)
    await cache_service.set_cached(key, json.dumps(summary, default=str))
    return summary


@router.get("/api/batch", tags=["api"])
async def api_batch_query(
    db: DbSession,
    station_ids: str = Query(...),
    start_date: date = Query(...),
    end_date: date = Query(...),
):
    ids = [UUID(s.strip()) for s in station_ids.split(",") if s.strip()]
    records = await revenue_service.batch_query_revenue(db, station_ids=ids, start_date=start_date, end_date=end_date)
    return [
        {
            "id": str(r.id),
            "station_id": str(r.station_id),
            "record_date": r.record_date.isoformat(),
            "generation_kwh": r.generation_kwh,
            "consumption_kwh": r.consumption_kwh,
            "grid_feed_kwh": r.grid_feed_kwh,
            "electricity_revenue": r.electricity_revenue,
            "subsidy_revenue": r.subsidy_revenue,
            "total_revenue": r.total_revenue,
            "peak_load_kw": r.peak_load_kw,
        }
        for r in records
    ]
