from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import User
from app.services.auth_service import get_current_user
from app.services.report_service import get_quality_report, get_delay_report

router = APIRouter(prefix="/api/reports", tags=["报表统计"])


@router.get("/quality")
async def quality_report(
    year: Optional[int] = None,
    month: Optional[int] = None,
    contract_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_quality_report(db, year=year, month=month, contract_id=contract_id)


@router.get("/delay")
async def delay_report(
    year: Optional[int] = None,
    month: Optional[int] = None,
    contract_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_delay_report(db, year=year, month=month, contract_id=contract_id)
