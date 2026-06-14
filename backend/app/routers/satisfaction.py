from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import User
from app.schemas.schemas import (
    SatisfactionRecordResponse,
    SatisfactionRecordUpdate,
    PaginatedResponse,
    NotificationResponse,
)
from app.services.auth_service import get_current_user
from app.services.satisfaction_service import (
    get_satisfaction_records,
    get_satisfaction_record,
    update_satisfaction_record,
    send_satisfaction_reminder,
)

router = APIRouter(prefix="/api/satisfaction", tags=["满意度管理"])


@router.get("", response_model=PaginatedResponse)
async def list_satisfaction_records(
    page: int = 1,
    page_size: int = 10,
    contract_id: Optional[int] = None,
    level: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_satisfaction_records(
        db, page=page, page_size=page_size, contract_id=contract_id, level=level
    )


@router.put("/{record_id}", response_model=SatisfactionRecordResponse)
async def update_satisfaction(
    record_id: int,
    data: SatisfactionRecordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = await get_satisfaction_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="满意度记录不存在")
    return await update_satisfaction_record(db, record, data)


@router.post("/{record_id}/remind", response_model=NotificationResponse)
async def remind_satisfaction(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = await get_satisfaction_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="满意度记录不存在")
    return await send_satisfaction_reminder(db, record)
