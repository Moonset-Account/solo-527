import uuid
from datetime import date, datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ElectricityPrice, SubsidyRule, RevenueRecord, EnergyConsumption
from app.services.tariff_service import get_active_prices, get_active_subsidy_rules


async def calculate_revenue(
    db: AsyncSession,
    station_id: uuid.UUID,
    record_date: date,
    generation_kwh: float,
    consumption_kwh: float,
    grid_feed_kwh: float,
    peak_load_kw: float | None = None,
) -> RevenueRecord:
    prices = await get_active_prices(db, station_id)
    electricity_revenue = 0.0
    for price in prices:
        electricity_revenue += grid_feed_kwh * price.price_per_kwh

    subsidy_rules = await get_active_subsidy_rules(db, station_id)
    subsidy_revenue = 0.0
    for rule in subsidy_rules:
        subsidy_revenue += generation_kwh * rule.rate_per_kwh

    total_revenue = electricity_revenue + subsidy_revenue

    record = RevenueRecord(
        station_id=station_id,
        record_date=record_date,
        generation_kwh=generation_kwh,
        consumption_kwh=consumption_kwh,
        grid_feed_kwh=grid_feed_kwh,
        electricity_revenue=electricity_revenue,
        subsidy_revenue=subsidy_revenue,
        total_revenue=total_revenue,
        peak_load_kw=peak_load_kw,
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)
    return record


async def get_revenue_records(
    db: AsyncSession,
    station_id: uuid.UUID,
    start_date: date | None = None,
    end_date: date | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[RevenueRecord]:
    stmt = select(RevenueRecord).where(RevenueRecord.station_id == station_id)
    if start_date is not None:
        stmt = stmt.where(RevenueRecord.record_date >= start_date)
    if end_date is not None:
        stmt = stmt.where(RevenueRecord.record_date <= end_date)
    stmt = stmt.order_by(RevenueRecord.record_date.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def batch_query_revenue(
    db: AsyncSession,
    station_ids: list[uuid.UUID],
    start_date: date,
    end_date: date,
) -> list[RevenueRecord]:
    stmt = (
        select(RevenueRecord)
        .where(
            RevenueRecord.station_id.in_(station_ids),
            RevenueRecord.record_date >= start_date,
            RevenueRecord.record_date <= end_date,
        )
        .order_by(RevenueRecord.station_id, RevenueRecord.record_date.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_peak_load_analysis(
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
            "peak_load_kw": rec.peak_load_kw,
            "strategy_status": "normal" if rec.peak_load_kw and rec.peak_load_kw < 100 else "warning",
        }
        for rec in records
    ]


async def get_energy_curve(
    db: AsyncSession,
    station_id: uuid.UUID,
    start_time: datetime,
    end_time: datetime,
    interval_minutes: int = 15,
) -> list[EnergyConsumption]:
    stmt = (
        select(EnergyConsumption)
        .where(
            EnergyConsumption.station_id == station_id,
            EnergyConsumption.record_time >= start_time,
            EnergyConsumption.record_time <= end_time,
        )
        .order_by(EnergyConsumption.record_time)
    )
    result = await db.execute(stmt)
    all_records = list(result.scalars().all())
    if interval_minutes <= 0 or not all_records:
        return all_records
    filtered = [all_records[0]]
    threshold = interval_minutes * 60
    for rec in all_records[1:]:
        delta = (rec.record_time - filtered[-1].record_time).total_seconds()
        if delta >= threshold:
            filtered.append(rec)
    return filtered


async def batch_query_energy_curves(
    db: AsyncSession,
    station_ids: list[uuid.UUID],
    start_time: datetime,
    end_time: datetime,
) -> list[EnergyConsumption]:
    stmt = (
        select(EnergyConsumption)
        .where(
            EnergyConsumption.station_id.in_(station_ids),
            EnergyConsumption.record_time >= start_time,
            EnergyConsumption.record_time <= end_time,
        )
        .order_by(EnergyConsumption.station_id, EnergyConsumption.record_time)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_revenue_summary(
    db: AsyncSession,
    station_id: uuid.UUID,
    start_date: date,
    end_date: date,
) -> dict:
    stmt = (
        select(
            func.coalesce(func.sum(RevenueRecord.generation_kwh), 0).label("total_generation"),
            func.coalesce(func.sum(RevenueRecord.total_revenue), 0).label("total_revenue"),
            func.coalesce(func.max(RevenueRecord.peak_load_kw), 0).label("max_peak_load"),
            func.count().label("record_count"),
        )
        .where(
            RevenueRecord.station_id == station_id,
            RevenueRecord.record_date >= start_date,
            RevenueRecord.record_date <= end_date,
        )
    )
    result = await db.execute(stmt)
    row = result.one()
    record_count = row.record_count or 0
    avg_daily_revenue = row.total_revenue / record_count if record_count > 0 else 0.0
    return {
        "total_generation": float(row.total_generation),
        "total_revenue": float(row.total_revenue),
        "avg_daily_revenue": float(avg_daily_revenue),
        "max_peak_load": float(row.max_peak_load),
    }
