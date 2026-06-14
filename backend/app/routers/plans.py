from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import User
from app.schemas.schemas import (
    PlanCreate,
    PlanResponse,
    PlanUpdate,
    PaginatedResponse,
)
from app.services.auth_service import get_current_user
from app.services.plan_service import (
    get_plans,
    get_plan,
    create_plan,
    update_plan,
    delete_plan,
)

router = APIRouter(prefix="/api/plans", tags=["方案管理"])


@router.get("", response_model=PaginatedResponse)
async def list_plans(
    page: int = 1,
    page_size: int = 10,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_plans(db, page=page, page_size=page_size, status=status)


@router.post("", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
async def create_new_plan(
    data: PlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await create_plan(db, data)


@router.get("/{plan_id}", response_model=PlanResponse)
async def get_plan_detail(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = await get_plan(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="方案不存在")
    return plan


@router.put("/{plan_id}", response_model=PlanResponse)
async def update_existing_plan(
    plan_id: int,
    data: PlanUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = await get_plan(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="方案不存在")
    return await update_plan(db, plan, data)


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = await get_plan(db, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="方案不存在")
    await delete_plan(db, plan)
