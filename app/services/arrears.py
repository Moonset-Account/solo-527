from __future__ import annotations
import uuid
from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Arrear, HealthStat, Tenant


class ArrearService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list(self, status: str | None = None, offset: int = 0, limit: int = 20) -> list[Arrear]:
        stmt = select(Arrear)
        if status:
            stmt = stmt.where(Arrear.status == status)
        stmt = stmt.order_by(Arrear.created_at.desc()).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> Arrear:
        kwargs["id"] = kwargs.get("id", uuid.uuid4().hex)
        kwargs["created_at"] = datetime.utcnow()
        kwargs["updated_at"] = datetime.utcnow()
        arrear = Arrear(**kwargs)
        self.session.add(arrear)
        await self.session.flush()
        return arrear

    async def update(self, arrear_id: str, **kwargs) -> Arrear | None:
        stmt = select(Arrear).where(Arrear.id == arrear_id)
        result = await self.session.execute(stmt)
        arrear = result.scalar_one_or_none()
        if not arrear:
            return None
        if "status" in kwargs and kwargs["status"] == "resolved":
            arrear.resolved_at = datetime.utcnow()
        for key, value in kwargs.items():
            setattr(arrear, key, value)
        arrear.updated_at = datetime.utcnow()
        await self.session.flush()
        return arrear

    async def get_health_stats_summary(self) -> dict:
        total_stmt = select(func.count(Arrear.id))
        total = (await self.session.execute(total_stmt)).scalar() or 0

        unpaid_stmt = select(func.count(Arrear.id)).where(Arrear.status == "unpaid")
        unpaid = (await self.session.execute(unpaid_stmt)).scalar() or 0

        paid_stmt = select(func.count(Arrear.id)).where(Arrear.status == "paid")
        paid = (await self.session.execute(paid_stmt)).scalar() or 0

        resolved_stmt = select(func.count(Arrear.id)).where(Arrear.status == "resolved")
        resolved = (await self.session.execute(resolved_stmt)).scalar() or 0

        avg_overdue_stmt = select(func.avg(Arrear.overdue_days))
        avg_overdue = (await self.session.execute(avg_overdue_stmt)).scalar() or 0

        total_arrears_stmt = select(func.coalesce(func.sum(Arrear.amount), 0)).where(Arrear.status == "unpaid")
        total_arrears_amount = (await self.session.execute(total_arrears_stmt)).scalar() or 0

        avg_health_stmt = select(func.avg(Tenant.health_score))
        avg_health_score = (await self.session.execute(avg_health_stmt)).scalar() or 0

        low_health_stmt = select(func.count(Tenant.id)).where(Tenant.health_score < 60)
        low_health_count = (await self.session.execute(low_health_stmt)).scalar() or 0

        return {
            "total": total,
            "unpaid": unpaid,
            "paid": paid,
            "resolved": resolved,
            "avg_overdue_days": round(float(avg_overdue), 2),
            "avg_health_score": round(float(avg_health_score), 2),
            "low_health_count": int(low_health_count),
            "total_arrears_amount": round(float(total_arrears_amount), 2),
        }


class HealthStatService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_by_tenant(self, tenant_id: str, limit: int = 10) -> list[HealthStat]:
        stmt = select(HealthStat).where(HealthStat.tenant_id == tenant_id).order_by(HealthStat.recorded_at.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> HealthStat:
        kwargs["id"] = kwargs.get("id", uuid.uuid4().hex)
        kwargs["recorded_at"] = datetime.utcnow()
        stat = HealthStat(**kwargs)
        self.session.add(stat)
        await self.session.flush()
        return stat

    async def get_latest(self, tenant_id: str) -> HealthStat | None:
        stmt = select(HealthStat).where(HealthStat.tenant_id == tenant_id).order_by(HealthStat.recorded_at.desc()).limit(1)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
