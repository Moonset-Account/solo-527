from __future__ import annotations
import json
import uuid
from datetime import datetime

from sqlalchemy import select, func, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ApiUsage
from app.redis_client import redis_client


class ApiUsageService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_by_tenant(
        self, tenant_id: str, start_date: datetime | None = None, end_date: datetime | None = None, offset: int = 0, limit: int = 20
    ) -> list[ApiUsage]:
        stmt = select(ApiUsage).where(ApiUsage.tenant_id == tenant_id)
        if start_date:
            stmt = stmt.where(ApiUsage.created_at >= start_date)
        if end_date:
            stmt = stmt.where(ApiUsage.created_at <= end_date)
        stmt = stmt.order_by(ApiUsage.created_at.desc()).offset(offset).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_trend(self, tenant_id: str) -> list[dict]:
        cache_key = f"usage:trend:{tenant_id}"
        cached = await redis_client.get(cache_key)
        if cached:
            return json.loads(cached)

        stmt = (
            select(
                cast(ApiUsage.created_at, Date).label("date"),
                func.sum(ApiUsage.call_count).label("total_calls"),
                func.avg(ApiUsage.response_ms).label("avg_response_ms"),
            )
            .where(ApiUsage.tenant_id == tenant_id)
            .group_by(cast(ApiUsage.created_at, Date))
            .order_by(cast(ApiUsage.created_at, Date))
        )
        result = await self.session.execute(stmt)
        trend = [
            {
                "date": row.date.isoformat(),
                "total_calls": int(row.total_calls),
                "avg_response_ms": round(float(row.avg_response_ms), 2) if row.avg_response_ms else 0,
            }
            for row in result.all()
        ]
        await redis_client.set(cache_key, json.dumps(trend), ex=300)
        return trend

    async def create_bulk(self, records: list[dict]) -> list[ApiUsage]:
        usage_list = []
        for record in records:
            record["id"] = record.get("id", uuid.uuid4().hex)
            record["created_at"] = datetime.utcnow()
            usage = ApiUsage(**record)
            self.session.add(usage)
            usage_list.append(usage)
        await self.session.flush()
        return usage_list
