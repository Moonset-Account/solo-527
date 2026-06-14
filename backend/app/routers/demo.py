from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import User
from app.services.auth_service import get_current_user
from app.services.demo_service import seed_demo_data, clear_demo_data

router = APIRouter(prefix="/api/demo", tags=["演示数据"])


@router.post("/seed")
async def seed_demo(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await seed_demo_data()


@router.delete("/clear")
async def clear_demo(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await clear_demo_data()
