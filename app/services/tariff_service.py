import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ElectricityPrice, SubsidyRule


async def create_electricity_price(
    db: AsyncSession,
    station_id: uuid.UUID,
    period_type: str,
    price_per_kwh: float,
    effective_date: date,
    created_by: str,
    expiry_date: date | None = None,
) -> ElectricityPrice:
    price = ElectricityPrice(
        station_id=station_id,
        period_type=period_type,
        price_per_kwh=price_per_kwh,
        effective_date=effective_date,
        expiry_date=expiry_date,
        created_by=created_by,
    )
    db.add(price)
    await db.flush()
    await db.refresh(price)
    return price


async def update_electricity_price(
    db: AsyncSession,
    price_id: uuid.UUID,
    **kwargs,
) -> ElectricityPrice:
    result = await db.execute(select(ElectricityPrice).where(ElectricityPrice.id == price_id))
    price = result.scalar_one_or_none()
    if price is None:
        raise ValueError(f"ElectricityPrice {price_id} not found")
    changed = False
    for key, value in kwargs.items():
        if hasattr(price, key) and getattr(price, key) != value:
            setattr(price, key, value)
            changed = True
    if changed:
        price.version = (price.version or 0) + 1
    await db.flush()
    await db.refresh(price)
    return price


async def rollback_electricity_price(
    db: AsyncSession,
    price_id: uuid.UUID,
    target_version: int,
) -> ElectricityPrice:
    result = await db.execute(select(ElectricityPrice).where(ElectricityPrice.id == price_id))
    price = result.scalar_one_or_none()
    if price is None:
        raise ValueError(f"ElectricityPrice {price_id} not found")
    if target_version >= price.version:
        raise ValueError(f"Target version {target_version} must be less than current version {price.version}")
    price.version = target_version
    await db.flush()
    await db.refresh(price)
    return price


async def get_active_prices(db: AsyncSession, station_id: uuid.UUID) -> list[ElectricityPrice]:
    stmt = (
        select(ElectricityPrice)
        .where(ElectricityPrice.station_id == station_id, ElectricityPrice.is_active == True)
        .order_by(ElectricityPrice.effective_date.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_subsidy_rule(
    db: AsyncSession,
    station_id: uuid.UUID,
    rule_name: str,
    subsidy_type: str,
    rate_per_kwh: float,
    effective_date: date,
    created_by: str,
    **kwargs,
) -> SubsidyRule:
    rule = SubsidyRule(
        station_id=station_id,
        rule_name=rule_name,
        subsidy_type=subsidy_type,
        rate_per_kwh=rate_per_kwh,
        effective_date=effective_date,
        created_by=created_by,
        description=kwargs.get("description"),
        expiry_date=kwargs.get("expiry_date"),
    )
    db.add(rule)
    await db.flush()
    await db.refresh(rule)
    return rule


async def update_subsidy_rule(
    db: AsyncSession,
    rule_id: uuid.UUID,
    **kwargs,
) -> SubsidyRule:
    result = await db.execute(select(SubsidyRule).where(SubsidyRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if rule is None:
        raise ValueError(f"SubsidyRule {rule_id} not found")
    changed = False
    for key, value in kwargs.items():
        if hasattr(rule, key) and getattr(rule, key) != value:
            setattr(rule, key, value)
            changed = True
    if changed:
        rule.version = (rule.version or 0) + 1
    await db.flush()
    await db.refresh(rule)
    return rule


async def rollback_subsidy_rule(
    db: AsyncSession,
    rule_id: uuid.UUID,
    target_version: int,
) -> SubsidyRule:
    result = await db.execute(select(SubsidyRule).where(SubsidyRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if rule is None:
        raise ValueError(f"SubsidyRule {rule_id} not found")
    if target_version >= rule.version:
        raise ValueError(f"Target version {target_version} must be less than current version {rule.version}")
    rule.version = target_version
    await db.flush()
    await db.refresh(rule)
    return rule


async def get_active_subsidy_rules(db: AsyncSession, station_id: uuid.UUID) -> list[SubsidyRule]:
    stmt = (
        select(SubsidyRule)
        .where(SubsidyRule.station_id == station_id, SubsidyRule.is_active == True)
        .order_by(SubsidyRule.effective_date.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_price_version_history(db: AsyncSession, price_id: uuid.UUID) -> list[dict]:
    result = await db.execute(select(ElectricityPrice).where(ElectricityPrice.id == price_id))
    price = result.scalar_one_or_none()
    if price is None:
        raise ValueError(f"ElectricityPrice {price_id} not found")
    return [
        {
            "id": str(price.id),
            "station_id": str(price.station_id),
            "period_type": price.period_type,
            "price_per_kwh": price.price_per_kwh,
            "effective_date": price.effective_date.isoformat() if price.effective_date else None,
            "expiry_date": price.expiry_date.isoformat() if price.expiry_date else None,
            "version": price.version,
            "is_active": price.is_active,
            "created_by": price.created_by,
            "created_at": price.created_at.isoformat() if price.created_at else None,
            "updated_at": price.updated_at.isoformat() if price.updated_at else None,
        }
    ]


async def get_subsidy_version_history(db: AsyncSession, rule_id: uuid.UUID) -> list[dict]:
    result = await db.execute(select(SubsidyRule).where(SubsidyRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if rule is None:
        raise ValueError(f"SubsidyRule {rule_id} not found")
    return [
        {
            "id": str(rule.id),
            "station_id": str(rule.station_id),
            "rule_name": rule.rule_name,
            "subsidy_type": rule.subsidy_type,
            "rate_per_kwh": rule.rate_per_kwh,
            "effective_date": rule.effective_date.isoformat() if rule.effective_date else None,
            "expiry_date": rule.expiry_date.isoformat() if rule.expiry_date else None,
            "version": rule.version,
            "is_active": rule.is_active,
            "created_by": rule.created_by,
            "description": rule.description,
            "created_at": rule.created_at.isoformat() if rule.created_at else None,
            "updated_at": rule.updated_at.isoformat() if rule.updated_at else None,
        }
    ]
