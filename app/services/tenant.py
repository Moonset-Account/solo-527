from __future__ import annotations
import uuid
from datetime import datetime

from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Tenant, FeatureFlag


class TenantService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_tenants(self, offset: int = 0, limit: int = 20) -> list[Tenant]:
        stmt = select(Tenant).offset(offset).limit(limit).order_by(Tenant.created_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get(self, tenant_id: str) -> Tenant | None:
        stmt = select(Tenant).where(Tenant.id == tenant_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Tenant:
        kwargs["id"] = kwargs.get("id", uuid.uuid4().hex)
        kwargs["created_at"] = datetime.utcnow()
        kwargs["updated_at"] = datetime.utcnow()
        tenant = Tenant(**kwargs)
        self.session.add(tenant)
        await self.session.flush()
        return tenant

    async def update(self, tenant_id: str, **kwargs) -> Tenant | None:
        tenant = await self.get(tenant_id)
        if not tenant:
            return None
        kwargs["updated_at"] = datetime.utcnow()
        for key, value in kwargs.items():
            setattr(tenant, key, value)
        await self.session.flush()
        return tenant

    async def toggle_active(self, tenant_id: str) -> Tenant | None:
        tenant = await self.get(tenant_id)
        if not tenant:
            return None
        tenant.is_active = not tenant.is_active
        tenant.updated_at = datetime.utcnow()
        await self.session.flush()
        return tenant

    async def update_health_score(self, tenant_id: str, score: int) -> Tenant | None:
        tenant = await self.get(tenant_id)
        if not tenant:
            return None
        tenant.health_score = score
        tenant.updated_at = datetime.utcnow()
        await self.session.flush()
        return tenant


class FeatureFlagService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_by_tenant(self, tenant_id: str) -> list[FeatureFlag]:
        stmt = select(FeatureFlag).where(FeatureFlag.tenant_id == tenant_id).order_by(FeatureFlag.created_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> FeatureFlag:
        kwargs["id"] = kwargs.get("id", uuid.uuid4().hex)
        kwargs["created_at"] = datetime.utcnow()
        kwargs["updated_at"] = datetime.utcnow()
        flag = FeatureFlag(**kwargs)
        self.session.add(flag)
        await self.session.flush()
        return flag

    async def update(self, flag_id: str, **kwargs) -> FeatureFlag | None:
        stmt = select(FeatureFlag).where(FeatureFlag.id == flag_id)
        result = await self.session.execute(stmt)
        flag = result.scalar_one_or_none()
        if not flag:
            return None
        kwargs["updated_at"] = datetime.utcnow()
        for key, value in kwargs.items():
            setattr(flag, key, value)
        await self.session.flush()
        return flag

    async def toggle(self, flag_id: str) -> FeatureFlag | None:
        stmt = select(FeatureFlag).where(FeatureFlag.id == flag_id)
        result = await self.session.execute(stmt)
        flag = result.scalar_one_or_none()
        if not flag:
            return None
        flag.is_enabled = not flag.is_enabled
        flag.updated_at = datetime.utcnow()
        await self.session.flush()
        return flag
