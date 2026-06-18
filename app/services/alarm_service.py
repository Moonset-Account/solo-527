import uuid
from datetime import datetime

from sqlalchemy import select, func, case
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Alarm, AlarmResponse


async def create_alarm(
    db: AsyncSession,
    station_id: uuid.UUID,
    equipment_id: uuid.UUID,
    alarm_type: str,
    severity: str,
    description: str | None = None,
) -> Alarm:
    alarm = Alarm(
        station_id=station_id,
        equipment_id=equipment_id,
        alarm_type=alarm_type,
        severity=severity,
        description=description,
    )
    db.add(alarm)
    await db.flush()
    await db.refresh(alarm)
    return alarm


async def acknowledge_alarm(
    db: AsyncSession,
    alarm_id: uuid.UUID,
    responder_id: str,
) -> Alarm:
    result = await db.execute(select(Alarm).where(Alarm.id == alarm_id))
    alarm = result.scalar_one_or_none()
    if alarm is None:
        raise ValueError(f"Alarm {alarm_id} not found")
    if alarm.status != "pending":
        raise ValueError(f"Alarm status is '{alarm.status}', expected 'pending'")
    alarm.status = "acknowledged"
    response = AlarmResponse(
        alarm_id=alarm_id,
        responder_id=responder_id,
        action="acknowledged",
    )
    db.add(response)
    await db.flush()
    await db.refresh(alarm)
    return alarm


async def process_alarm(
    db: AsyncSession,
    alarm_id: uuid.UUID,
    responder_id: str,
    action: str,
    notes: str | None = None,
    root_cause: str | None = None,
    response_duration_seconds: float | None = None,
) -> AlarmResponse:
    result = await db.execute(select(Alarm).where(Alarm.id == alarm_id))
    alarm = result.scalar_one_or_none()
    if alarm is None:
        raise ValueError(f"Alarm {alarm_id} not found")
    if action == "resolved":
        alarm.status = "resolved"
    else:
        alarm.status = "processing"
    response = AlarmResponse(
        alarm_id=alarm_id,
        responder_id=responder_id,
        action=action,
        notes=notes,
        root_cause=root_cause,
        response_duration_seconds=response_duration_seconds,
    )
    db.add(response)
    await db.flush()
    await db.refresh(response)
    return response


async def resolve_alarm(
    db: AsyncSession,
    alarm_id: uuid.UUID,
    resolver_id: str,
    root_cause: str,
    notes: str | None = None,
    response_duration_seconds: float | None = None,
) -> Alarm:
    result = await db.execute(select(Alarm).where(Alarm.id == alarm_id))
    alarm = result.scalar_one_or_none()
    if alarm is None:
        raise ValueError(f"Alarm {alarm_id} not found")
    alarm.status = "resolved"
    response = AlarmResponse(
        alarm_id=alarm_id,
        responder_id=resolver_id,
        action="resolved",
        notes=notes,
        root_cause=root_cause,
        response_duration_seconds=response_duration_seconds,
    )
    db.add(response)
    await db.flush()
    await db.refresh(alarm)
    return alarm


async def close_alarm(db: AsyncSession, alarm_id: uuid.UUID) -> Alarm:
    result = await db.execute(select(Alarm).where(Alarm.id == alarm_id))
    alarm = result.scalar_one_or_none()
    if alarm is None:
        raise ValueError(f"Alarm {alarm_id} not found")
    alarm.status = "closed"
    await db.flush()
    await db.refresh(alarm)
    return alarm


async def get_alarms(
    db: AsyncSession,
    station_id: uuid.UUID | None = None,
    status: str | None = None,
    severity: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Alarm]:
    stmt = select(Alarm)
    if station_id is not None:
        stmt = stmt.where(Alarm.station_id == station_id)
    if status is not None:
        stmt = stmt.where(Alarm.status == status)
    if severity is not None:
        stmt = stmt.where(Alarm.severity == severity)
    stmt = stmt.order_by(Alarm.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_alarm_with_responses(db: AsyncSession, alarm_id: uuid.UUID) -> Alarm:
    stmt = select(Alarm).where(Alarm.id == alarm_id).options(selectinload(Alarm.responses))
    result = await db.execute(stmt)
    alarm = result.scalar_one_or_none()
    if alarm is None:
        raise ValueError(f"Alarm {alarm_id} not found")
    return alarm


async def get_alarm_stats(db: AsyncSession, station_id: uuid.UUID) -> dict:
    base_stmt = select(Alarm).where(Alarm.station_id == station_id)

    status_stmt = base_stmt.with_only_columns(
        Alarm.status,
        func.count().label("count"),
    ).group_by(Alarm.status)
    status_result = await db.execute(status_stmt)
    status_counts = {row.status: row.count for row in status_result}

    severity_stmt = base_stmt.with_only_columns(
        Alarm.severity,
        func.count().label("count"),
    ).group_by(Alarm.severity)
    severity_result = await db.execute(severity_stmt)
    severity_counts = {row.severity: row.count for row in severity_result}

    return {
        "by_status": status_counts,
        "by_severity": severity_counts,
    }
