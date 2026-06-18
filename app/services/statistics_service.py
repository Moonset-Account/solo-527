import uuid
from datetime import date

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import RevenueRecord, Alarm, AlarmResponse


async def get_energy_peak_summary(
    db: AsyncSession,
    station_id: uuid.UUID,
    start_date: date,
    end_date: date,
) -> list[dict]:
    stmt = (
        select(RevenueRecord)
        .where(
            RevenueRecord.station_id == station_id,
            RevenueRecord.record_date >= start_date,
            RevenueRecord.record_date <= end_date,
            RevenueRecord.peak_load_kw.isnot(None),
        )
        .order_by(RevenueRecord.record_date)
    )
    result = await db.execute(stmt)
    records = result.scalars().all()
    return [
        {
            "date": rec.record_date.isoformat(),
            "peak_kw": rec.peak_load_kw,
            "hour": 12,
        }
        for rec in records
    ]


async def trace_strategy_failure(db: AsyncSession, alarm_id: uuid.UUID) -> dict:
    stmt = (
        select(Alarm)
        .where(Alarm.id == alarm_id)
        .options(selectinload(Alarm.responses))
    )
    result = await db.execute(stmt)
    alarm = result.scalar_one_or_none()
    if alarm is None:
        raise ValueError(f"Alarm {alarm_id} not found")
    root_cause = None
    responder_id = None
    for resp in alarm.responses:
        if resp.root_cause:
            root_cause = resp.root_cause
        if resp.responder_id:
            responder_id = resp.responder_id
    return {
        "alarm": {
            "id": str(alarm.id),
            "alarm_type": alarm.alarm_type,
            "severity": alarm.severity,
            "status": alarm.status,
            "description": alarm.description,
            "created_at": alarm.created_at.isoformat() if alarm.created_at else None,
        },
        "root_cause": root_cause,
        "response_records": [
            {
                "id": str(resp.id),
                "responder_id": resp.responder_id,
                "action": resp.action,
                "notes": resp.notes,
                "root_cause": resp.root_cause,
                "response_duration_seconds": resp.response_duration_seconds,
                "created_at": resp.created_at.isoformat() if resp.created_at else None,
            }
            for resp in alarm.responses
        ],
        "responsible_person": responder_id,
        "strategy_name": alarm.alarm_type,
    }


async def get_response_time_stats(
    db: AsyncSession,
    station_id: uuid.UUID,
    start_date: date,
    end_date: date,
) -> dict:
    alarm_stmt = select(Alarm.id).where(
        Alarm.station_id == station_id,
        Alarm.created_at >= start_date,
        Alarm.created_at <= end_date,
    )
    alarm_result = await db.execute(alarm_stmt)
    alarm_ids = [row.id for row in alarm_result.all()]

    if not alarm_ids:
        return {
            "avg_response_time": 0.0,
            "max_response_time": 0.0,
            "by_severity": {},
        }

    duration_stmt = select(
        Alarm.severity,
        func.coalesce(func.avg(AlarmResponse.response_duration_seconds), 0).label("avg_duration"),
        func.coalesce(func.max(AlarmResponse.response_duration_seconds), 0).label("max_duration"),
    ).join(
        AlarmResponse, Alarm.id == AlarmResponse.alarm_id
    ).where(
        Alarm.id.in_(alarm_ids),
        AlarmResponse.response_duration_seconds.isnot(None),
    ).group_by(Alarm.severity)

    duration_result = await db.execute(duration_stmt)
    by_severity = {}
    all_avg = []
    max_overall = 0.0
    for row in duration_result:
        by_severity[row.severity] = {
            "avg_response_time": float(row.avg_duration),
            "max_response_time": float(row.max_duration),
        }
        all_avg.append(float(row.avg_duration))
        if float(row.max_duration) > max_overall:
            max_overall = float(row.max_duration)

    avg_overall = sum(all_avg) / len(all_avg) if all_avg else 0.0
    return {
        "avg_response_time": avg_overall,
        "max_response_time": max_overall,
        "by_severity": by_severity,
    }


async def get_responsible_person_stats(
    db: AsyncSession,
    station_id: uuid.UUID,
    start_date: date,
    end_date: date,
) -> list[dict]:
    alarm_stmt = select(Alarm.id).where(
        Alarm.station_id == station_id,
        Alarm.created_at >= start_date,
        Alarm.created_at <= end_date,
    )
    alarm_result = await db.execute(alarm_stmt)
    alarm_ids = [row.id for row in alarm_result.all()]

    if not alarm_ids:
        return []

    stats_stmt = select(
        AlarmResponse.responder_id,
        func.count().label("total_responses"),
        func.coalesce(func.avg(AlarmResponse.response_duration_seconds), 0).label("avg_duration"),
        func.count(AlarmResponse.root_cause).label("alarms_resolved"),
    ).where(
        AlarmResponse.alarm_id.in_(alarm_ids),
    ).group_by(AlarmResponse.responder_id)

    stats_result = await db.execute(stats_stmt)
    return [
        {
            "responder_id": row.responder_id,
            "total_responses": row.total_responses,
            "avg_duration": float(row.avg_duration),
            "alarms_resolved": row.alarms_resolved,
        }
        for row in stats_result
    ]


async def get_full_trace_chain(
    db: AsyncSession,
    station_id: uuid.UUID,
    start_date: date,
    end_date: date,
) -> list[dict]:
    peak_summary = await get_energy_peak_summary(db, station_id, start_date, end_date)

    alarm_stmt = (
        select(Alarm)
        .where(
            Alarm.station_id == station_id,
            Alarm.created_at >= start_date,
            Alarm.created_at <= end_date,
        )
        .options(selectinload(Alarm.responses))
        .order_by(Alarm.created_at)
    )
    alarm_result = await db.execute(alarm_stmt)
    alarms = alarm_result.scalars().all()

    chain = []
    for alarm in alarms:
        root_cause = None
        responder_id = None
        duration = None
        for resp in alarm.responses:
            if resp.root_cause:
                root_cause = resp.root_cause
            if resp.responder_id:
                responder_id = resp.responder_id
            if resp.response_duration_seconds:
                duration = resp.response_duration_seconds

        strategy_name = alarm.alarm_type
        strategy_status = "failed" if alarm.status in ("pending", "processing") else "resolved"

        chain.append({
            "energy_peak": None,
            "alarm": {
                "id": str(alarm.id),
                "alarm_type": alarm.alarm_type,
                "severity": alarm.severity,
                "status": alarm.status,
                "description": alarm.description,
                "created_at": alarm.created_at.isoformat() if alarm.created_at else None,
            },
            "strategy_failure": {
                "strategy_name": strategy_name,
                "strategy_status": strategy_status,
                "root_cause": root_cause,
            },
            "response_time": {
                "response_duration_seconds": duration,
            },
            "responsible_person": responder_id,
        })

    return chain
