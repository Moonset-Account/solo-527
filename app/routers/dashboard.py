from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Form
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import RedirectResponse
from starlette.templating import Jinja2Templates

from app.database import get_db
from app.models import PowerStation, Alarm

templates = Jinja2Templates(directory="app/templates")

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/")
async def dashboard(request: Request, db: DbSession):
    station_result = await db.execute(
        select(PowerStation).order_by(PowerStation.created_at.desc()).limit(10)
    )
    stations = list(station_result.scalars().all())

    alarm_result = await db.execute(
        select(Alarm)
        .where(Alarm.status.in_(["pending", "acknowledged"]))
        .order_by(Alarm.created_at.desc())
        .limit(10)
    )
    recent_alarms = list(alarm_result.scalars().all())

    station_count_result = await db.execute(select(func.count()).select_from(PowerStation))
    station_count = station_count_result.scalar()

    alarm_count_result = await db.execute(
        select(func.count()).select_from(Alarm).where(Alarm.status == "pending")
    )
    pending_alarm_count = alarm_count_result.scalar()

    context = {
        "request": request,
        "stations": stations,
        "recent_alarms": recent_alarms,
        "station_count": station_count,
        "pending_alarm_count": pending_alarm_count,
    }
    return templates.TemplateResponse("dashboard.html", context)


@router.get("/stations")
async def station_list(request: Request, db: DbSession):
    result = await db.execute(
        select(PowerStation).order_by(PowerStation.created_at.desc())
    )
    stations = list(result.scalars().all())
    return templates.TemplateResponse("partials/stations.html", {"request": request, "stations": stations})


@router.post("/stations")
async def create_station(
    db: DbSession,
    name: str = Form(...),
    capacity_kw: float = Form(...),
    location: str = Form(None),
):
    station = PowerStation(name=name, capacity_kw=capacity_kw, location=location)
    db.add(station)
    await db.commit()
    return RedirectResponse(url="/", status_code=303)
