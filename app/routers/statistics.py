import json
from typing import Annotated
from uuid import UUID
from datetime import date

from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.templating import Jinja2Templates

from app.database import get_db
from app.services import statistics_service, cache_service

templates = Jinja2Templates(directory="app/templates")

router = APIRouter(prefix="/statistics", tags=["statistics"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/")
async def statistics_page(request: Request):
    return templates.TemplateResponse("statistics.html", {"request": request})


@router.get("/energy-peaks")
async def energy_peaks(
    request: Request,
    db: DbSession,
    station_id: UUID = Query(...),
    start_date: date = Query(...),
    end_date: date = Query(...),
):
    data = await statistics_service.get_energy_peak_summary(db, station_id, start_date, end_date)
    return templates.TemplateResponse(
        "partials/energy_peaks.html", {"request": request, "peaks": data}
    )


@router.get("/strategy-failure/{alarm_id}")
async def strategy_failure(request: Request, db: DbSession, alarm_id: UUID):
    data = await statistics_service.trace_strategy_failure(db, alarm_id)
    return templates.TemplateResponse(
        "partials/strategy_failure.html", {"request": request, "trace": data}
    )


@router.get("/response-times")
async def response_times(
    request: Request,
    db: DbSession,
    station_id: UUID = Query(...),
    start_date: date = Query(...),
    end_date: date = Query(...),
):
    data = await statistics_service.get_response_time_stats(db, station_id, start_date, end_date)
    return templates.TemplateResponse(
        "partials/response_times.html", {"request": request, "stats": data}
    )


@router.get("/responsible-persons")
async def responsible_persons(
    request: Request,
    db: DbSession,
    station_id: UUID = Query(...),
    start_date: date = Query(...),
    end_date: date = Query(...),
):
    data = await statistics_service.get_responsible_person_stats(db, station_id, start_date, end_date)
    return templates.TemplateResponse(
        "partials/responsible_persons.html", {"request": request, "persons": data}
    )


@router.get("/trace-chain")
async def trace_chain(
    request: Request,
    db: DbSession,
    station_id: UUID = Query(...),
    start_date: date = Query(...),
    end_date: date = Query(...),
):
    data = await statistics_service.get_full_trace_chain(db, station_id, start_date, end_date)
    return templates.TemplateResponse(
        "partials/trace_chain.html", {"request": request, "chain": data}
    )


@router.get("/api/trace-chain", tags=["api"])
async def api_trace_chain(
    db: DbSession,
    station_id: UUID = Query(...),
    start_date: date = Query(...),
    end_date: date = Query(...),
):
    key = f"stats:trace_chain:{station_id}:{start_date}:{end_date}"
    cached = await cache_service.get_cached(key)
    if cached:
        return json.loads(cached)
    data = await statistics_service.get_full_trace_chain(db, station_id, start_date, end_date)
    await cache_service.set_cached(key, json.dumps(data, default=str))
    return data
