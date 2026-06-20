from __future__ import annotations
import uuid
from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Anomaly


class AnomalyService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list(self, tenant_id: str | None = None, status: str | None = None, offset: int = 0, limit: int = 20) -> list[Anomaly]:
        stmt = select(Anomaly)
        if tenant_id:
            stmt = stmt.where(Anomaly.tenant_id == tenant_id)
        if status:
            stmt = stmt.where(Anomaly.status == status)
        stmt = stmt.order_by(Anomaly.created_at.desc()).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> Anomaly:
        kwargs["id"] = kwargs.get("id", uuid.uuid4().hex)
        kwargs["created_at"] = datetime.utcnow()
        kwargs["updated_at"] = datetime.utcnow()
        anomaly = Anomaly(**kwargs)
        self.session.add(anomaly)
        await self.session.flush()
        return anomaly

    async def update_status(self, anomaly_id: str, status: str, **kwargs) -> Anomaly | None:
        stmt = select(Anomaly).where(Anomaly.id == anomaly_id)
        result = await self.session.execute(stmt)
        anomaly = result.scalar_one_or_none()
        if not anomaly:
            return None
        anomaly.status = status
        anomaly.updated_at = datetime.utcnow()
        for key, value in kwargs.items():
            setattr(anomaly, key, value)
        await self.session.flush()
        return anomaly

    async def resolve(self, anomaly_id: str, notes: str | None = None) -> Anomaly | None:
        stmt = select(Anomaly).where(Anomaly.id == anomaly_id)
        result = await self.session.execute(stmt)
        anomaly = result.scalar_one_or_none()
        if not anomaly:
            return None
        anomaly.status = "resolved"
        anomaly.resolved_at = datetime.utcnow()
        anomaly.updated_at = datetime.utcnow()
        if notes is not None:
            anomaly.notes = notes
        await self.session.flush()
        return anomaly

    async def get_stats_by_severity(self, tenant_id: str | None = None) -> list[dict]:
        stmt = select(Anomaly.severity, func.count(Anomaly.id).label("count")).group_by(Anomaly.severity)
        if tenant_id:
            stmt = stmt.where(Anomaly.tenant_id == tenant_id)
        result = await self.session.execute(stmt)
        return [{"severity": row.severity, "count": row.count} for row in result.all()]
