from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import SatisfactionRecord, Notification
from app.schemas.schemas import (
    SatisfactionRecordCreate,
    SatisfactionRecordUpdate,
    PaginatedResponse,
)
from app.services.base import model_to_dict


async def get_satisfaction_records(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 10,
    contract_id: Optional[int] = None,
    level: Optional[str] = None,
) -> PaginatedResponse:
    query = select(SatisfactionRecord)
    count_query = select(func.count()).select_from(SatisfactionRecord)
    if contract_id:
        query = query.where(SatisfactionRecord.contract_id == contract_id)
        count_query = count_query.where(SatisfactionRecord.contract_id == contract_id)
    if level:
        query = query.where(SatisfactionRecord.level == level)
        count_query = count_query.where(SatisfactionRecord.level == level)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    records = result.scalars().all()
    return PaginatedResponse(
        items=[model_to_dict(r) for r in records], total=total, page=page, page_size=page_size
    )


async def get_satisfaction_record(
    db: AsyncSession, record_id: int
) -> Optional[SatisfactionRecord]:
    result = await db.execute(
        select(SatisfactionRecord).where(SatisfactionRecord.id == record_id)
    )
    return result.scalar_one_or_none()


async def create_satisfaction_record(
    db: AsyncSession, data: SatisfactionRecordCreate
) -> SatisfactionRecord:
    record = SatisfactionRecord(**data.model_dump())
    db.add(record)
    await db.flush()
    return record


async def update_satisfaction_record(
    db: AsyncSession, record: SatisfactionRecord, data: SatisfactionRecordUpdate
) -> SatisfactionRecord:
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(record, key, value)
    await db.flush()
    return record


async def send_satisfaction_reminder(
    db: AsyncSession, record: SatisfactionRecord
) -> Notification:
    notification = Notification(
        user_id=record.customer_id,
        type="satisfaction_reminder",
        title="满意度评价提醒",
        content=f"请对合同进行满意度评价",
        is_demo=record.is_demo,
    )
    db.add(notification)
    await db.flush()
    return notification
