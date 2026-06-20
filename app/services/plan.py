from __future__ import annotations
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Plan, PlanRule


class PlanService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list(self, offset: int = 0, limit: int = 20) -> list[Plan]:
        stmt = select(Plan).offset(offset).limit(limit).order_by(Plan.created_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get(self, plan_id: str) -> Plan | None:
        stmt = select(Plan).where(Plan.id == plan_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, **kwargs) -> Plan:
        kwargs["id"] = kwargs.get("id", uuid.uuid4().hex)
        kwargs["created_at"] = datetime.utcnow()
        kwargs["updated_at"] = datetime.utcnow()
        plan = Plan(**kwargs)
        self.session.add(plan)
        await self.session.flush()
        return plan

    async def update(self, plan_id: str, **kwargs) -> Plan | None:
        plan = await self.get(plan_id)
        if not plan:
            return None
        kwargs["updated_at"] = datetime.utcnow()
        for key, value in kwargs.items():
            setattr(plan, key, value)
        await self.session.flush()
        return plan

    async def toggle_active(self, plan_id: str) -> Plan | None:
        plan = await self.get(plan_id)
        if not plan:
            return None
        plan.is_active = not plan.is_active
        plan.updated_at = datetime.utcnow()
        await self.session.flush()
        return plan


class PlanRuleService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_by_plan(self, plan_id: str) -> list[PlanRule]:
        stmt = select(PlanRule).where(PlanRule.plan_id == plan_id).order_by(PlanRule.created_at.desc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> PlanRule:
        kwargs["id"] = kwargs.get("id", uuid.uuid4().hex)
        kwargs["created_at"] = datetime.utcnow()
        kwargs["updated_at"] = datetime.utcnow()
        rule = PlanRule(**kwargs)
        self.session.add(rule)
        await self.session.flush()
        return rule

    async def update(self, rule_id: str, **kwargs) -> PlanRule | None:
        stmt = select(PlanRule).where(PlanRule.id == rule_id)
        result = await self.session.execute(stmt)
        rule = result.scalar_one_or_none()
        if not rule:
            return None
        kwargs["updated_at"] = datetime.utcnow()
        for key, value in kwargs.items():
            setattr(rule, key, value)
        await self.session.flush()
        return rule

    async def toggle(self, rule_id: str) -> PlanRule | None:
        stmt = select(PlanRule).where(PlanRule.id == rule_id)
        result = await self.session.execute(stmt)
        rule = result.scalar_one_or_none()
        if not rule:
            return None
        rule.is_active = not rule.is_active
        rule.updated_at = datetime.utcnow()
        await self.session.flush()
        return rule
