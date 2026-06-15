from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.rule import Rule


class RuleService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_rules(self):
        result = await self.db.execute(select(Rule).order_by(Rule.id))
        rules = result.scalars().all()
        return [
            {
                "id": r.id,
                "rule_type": r.rule_type,
                "name": r.name,
                "config": r.config,
                "is_active": r.is_active,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            }
            for r in rules
        ]

    async def create_rule(self, data):
        rule = Rule(
            rule_type=data.rule_type,
            name=data.name,
            config=data.config,
            is_active=data.is_active,
        )
        self.db.add(rule)
        await self.db.commit()
        await self.db.refresh(rule)
        return {
            "id": rule.id,
            "rule_type": rule.rule_type,
            "name": rule.name,
            "config": rule.config,
            "is_active": rule.is_active,
        }

    async def update_rule(self, rule_id: int, data):
        result = await self.db.execute(select(Rule).where(Rule.id == rule_id))
        rule = result.scalar_one_or_none()
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")
        if data.rule_type is not None:
            rule.rule_type = data.rule_type
        if data.name is not None:
            rule.name = data.name
        if data.config is not None:
            rule.config = data.config
        if data.is_active is not None:
            rule.is_active = data.is_active
        await self.db.commit()
        await self.db.refresh(rule)
        return {
            "id": rule.id,
            "rule_type": rule.rule_type,
            "name": rule.name,
            "config": rule.config,
            "is_active": rule.is_active,
        }

    async def delete_rule(self, rule_id: int):
        result = await self.db.execute(select(Rule).where(Rule.id == rule_id))
        rule = result.scalar_one_or_none()
        if not rule:
            raise HTTPException(status_code=404, detail="Rule not found")
        await self.db.delete(rule)
        await self.db.commit()
