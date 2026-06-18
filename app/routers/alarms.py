from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.templating import Jinja2Templates

from app.database import get_db
from app.services import alarm_service

templates = Jinja2Templates(directory="app/templates")

router = APIRouter(prefix="/alarms", tags=["alarms"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/")
async def alarm_list(
    request: Request,
    db: DbSession,
    station_id: UUID | None = Query(None),
    status: str | None = Query(None),
    severity: str | None = Query(None),
):
    alarms = await alarm_service.get_alarms(
        db, station_id=station_id, status=status, severity=severity
    )
    context = {
        "request": request,
        "alarms": alarms,
        "filter_station_id": station_id,
        "filter_status": status,
        "filter_severity": severity,
    }
    return templates.TemplateResponse("alarms.html", context)


@router.get("/{alarm_id}")
async def alarm_detail(request: Request, db: DbSession, alarm_id: UUID):
    alarm = await alarm_service.get_alarm_with_responses(db, alarm_id)
    return templates.TemplateResponse(
        "alarm_detail.html", {"request": request, "alarm": alarm}
    )


@router.post("/")
async def create_alarm(
    request: Request,
    db: DbSession,
    station_id: UUID = Form(...),
    equipment_id: UUID = Form(...),
    alarm_type: str = Form(...),
    severity: str = Form(...),
    description: str = Form(None),
):
    alarm = await alarm_service.create_alarm(
        db,
        station_id=station_id,
        equipment_id=equipment_id,
        alarm_type=alarm_type,
        severity=severity,
        description=description,
    )
    await db.commit()
    return templates.TemplateResponse(
        "partials/alarm_row.html", {"request": request, "alarm": alarm}
    )


@router.post("/{alarm_id}/acknowledge")
async def acknowledge_alarm(
    request: Request, db: DbSession, alarm_id: UUID, responder_id: str = Form(...)
):
    alarm = await alarm_service.acknowledge_alarm(db, alarm_id, responder_id)
    await db.commit()
    return templates.TemplateResponse(
        "partials/alarm_row.html", {"request": request, "alarm": alarm}
    )


@router.post("/{alarm_id}/respond")
async def respond_to_alarm(
    request: Request,
    db: DbSession,
    alarm_id: UUID,
    responder_id: str = Form(...),
    action: str = Form(...),
    notes: str = Form(None),
    root_cause: str = Form(None),
    response_duration_seconds: float = Form(None),
):
    await alarm_service.process_alarm(
        db,
        alarm_id,
        responder_id=responder_id,
        action=action,
        notes=notes,
        root_cause=root_cause,
        response_duration_seconds=response_duration_seconds,
    )
    alarm = await alarm_service.get_alarm_with_responses(db, alarm_id)
    await db.commit()
    return templates.TemplateResponse(
        "alarm_detail.html", {"request": request, "alarm": alarm}
    )


@router.post("/{alarm_id}/resolve")
async def resolve_alarm(
    request: Request,
    db: DbSession,
    alarm_id: UUID,
    resolver_id: str = Form(...),
    root_cause: str = Form(...),
    notes: str = Form(None),
    response_duration_seconds: float = Form(None),
):
    alarm = await alarm_service.resolve_alarm(
        db,
        alarm_id,
        resolver_id=resolver_id,
        root_cause=root_cause,
        notes=notes,
        response_duration_seconds=response_duration_seconds,
    )
    await db.commit()
    return templates.TemplateResponse(
        "partials/alarm_row.html", {"request": request, "alarm": alarm}
    )


@router.post("/{alarm_id}/close")
async def close_alarm(request: Request, db: DbSession, alarm_id: UUID):
    alarm = await alarm_service.close_alarm(db, alarm_id)
    await db.commit()
    return templates.TemplateResponse(
        "partials/alarm_row.html", {"request": request, "alarm": alarm}
    )


@router.get("/api/", tags=["api"])
async def api_alarm_list(
    db: DbSession,
    station_id: UUID | None = Query(None),
    status: str | None = Query(None),
    severity: str | None = Query(None),
    skip: int = Query(0),
    limit: int = Query(50),
):
    alarms = await alarm_service.get_alarms(
        db, station_id=station_id, status=status, severity=severity, skip=skip, limit=limit
    )
    return [
        {
            "id": str(a.id),
            "equipment_id": str(a.equipment_id),
            "station_id": str(a.station_id),
            "alarm_type": a.alarm_type,
            "severity": a.severity,
            "status": a.status,
            "description": a.description,
            "created_at": a.created_at.isoformat() if a.created_at else None,
            "updated_at": a.updated_at.isoformat() if a.updated_at else None,
        }
        for a in alarms
    ]


@router.get("/api/stats", tags=["api"])
async def api_alarm_stats(db: DbSession, station_id: UUID = Query(...)):
    stats = await alarm_service.get_alarm_stats(db, station_id)
    return stats
