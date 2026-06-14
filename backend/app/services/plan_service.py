from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Plan
from app.schemas.schemas import PlanCreate, PlanUpdate, PaginatedResponse
from app.services.base import model_to_dict


async def get_plans(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 10,
    status: Optional[str] = None,
) -> PaginatedResponse:
    query = select(Plan)
    count_query = select(func.count()).select_from(Plan)
    if status:
        query = query.where(Plan.status == status)
        count_query = count_query.where(Plan.status == status)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    plans = result.scalars().all()
    return PaginatedResponse(
        items=[model_to_dict(p) for p in plans], total=total, page=page, page_size=page_size
    )


async def get_plan(db: AsyncSession, plan_id: int) -> Optional[Plan]:
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    return result.scalar_one_or_none()


async def create_plan(db: AsyncSession, data: PlanCreate) -> Plan:
    plan = Plan(**data.model_dump())
    db.add(plan)
    await db.flush()
    return plan


async def update_plan(
    db: AsyncSession, plan: Plan, data: PlanUpdate
) -> Plan:
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(plan, key, value)
    await db.flush()
    return plan


async def delete_plan(db: AsyncSession, plan: Plan) -> None:
    await db.delete(plan)
    await db.flush()
