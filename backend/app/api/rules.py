from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.rule_service import RuleService

router = APIRouter(prefix="/rules", tags=["rules"])


class RuleCreate(BaseModel):
    rule_type: str
    name: str
    config: dict
    is_active: bool = True


class RuleUpdate(BaseModel):
    rule_type: str | None = None
    name: str | None = None
    config: dict | None = None
    is_active: bool | None = None


@router.get("")
async def list_rules(db: AsyncSession = Depends(get_db)):
    svc = RuleService(db)
    return await svc.list_rules()


@router.post("")
async def create_rule(data: RuleCreate, db: AsyncSession = Depends(get_db)):
    svc = RuleService(db)
    return await svc.create_rule(data)


@router.put("/{rule_id}")
async def update_rule(rule_id: int, data: RuleUpdate, db: AsyncSession = Depends(get_db)):
    svc = RuleService(db)
    return await svc.update_rule(rule_id, data)


@router.delete("/{rule_id}")
async def delete_rule(rule_id: int, db: AsyncSession = Depends(get_db)):
    svc = RuleService(db)
    await svc.delete_rule(rule_id)
    return {"ok": True}
