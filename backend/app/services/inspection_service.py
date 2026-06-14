from datetime import date
from typing import Optional

from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import InspectionTask, InspectionRecord
from app.schemas.schemas import (
    InspectionTaskCreate,
    InspectionTaskStatusUpdate,
    InspectionRecordCreate,
    PaginatedResponse,
)
from app.services.base import model_to_dict


async def get_inspection_tasks(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 10,
    contract_id: Optional[int] = None,
    status: Optional[str] = None,
) -> PaginatedResponse:
    query = select(InspectionTask)
    count_query = select(func.count()).select_from(InspectionTask)
    if contract_id:
        query = query.where(InspectionTask.contract_id == contract_id)
        count_query = count_query.where(InspectionTask.contract_id == contract_id)
    if status:
        query = query.where(InspectionTask.status == status)
        count_query = count_query.where(InspectionTask.status == status)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    tasks = result.scalars().all()
    return PaginatedResponse(
        items=[model_to_dict(t) for t in tasks], total=total, page=page, page_size=page_size
    )


async def get_inspection_task(
    db: AsyncSession, task_id: int
) -> Optional[InspectionTask]:
    result = await db.execute(
        select(InspectionTask).where(InspectionTask.id == task_id)
    )
    return result.scalar_one_or_none()


async def create_inspection_task(
    db: AsyncSession, data: InspectionTaskCreate
) -> InspectionTask:
    task = InspectionTask(**data.model_dump())
    db.add(task)
    await db.flush()
    return task


async def update_task_status(
    db: AsyncSession, task: InspectionTask, data: InspectionTaskStatusUpdate
) -> InspectionTask:
    task.status = data.status
    await db.flush()
    return task


async def create_inspection_record(
    db: AsyncSession, task_id: int, data: InspectionRecordCreate
) -> InspectionRecord:
    record = InspectionRecord(task_id=task_id, **data.model_dump())
    db.add(record)
    await db.flush()
    return record


async def get_inspection_records(
    db: AsyncSession, task_id: int
) -> list[InspectionRecord]:
    result = await db.execute(
        select(InspectionRecord).where(InspectionRecord.task_id == task_id)
    )
    return result.scalars().all()


async def detect_delayed_tasks(db: AsyncSession) -> list[InspectionTask]:
    today = date.today()
    result = await db.execute(
        select(InspectionTask).where(
            and_(
                InspectionTask.status.in_(["pending", "in_progress"]),
                InspectionTask.deadline < today,
                InspectionTask.is_delayed == False,
            )
        )
    )
    delayed_tasks = result.scalars().all()
    for task in delayed_tasks:
        task.is_delayed = True
    await db.flush()
    return delayed_tasks
