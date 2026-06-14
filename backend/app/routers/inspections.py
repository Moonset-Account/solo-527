from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.models import User
from app.schemas.schemas import (
    InspectionTaskCreate,
    InspectionTaskResponse,
    InspectionTaskStatusUpdate,
    InspectionRecordCreate,
    InspectionRecordResponse,
    PaginatedResponse,
)
from app.services.auth_service import get_current_user
from app.services.inspection_service import (
    get_inspection_tasks,
    get_inspection_task,
    create_inspection_task,
    update_task_status,
    create_inspection_record,
    get_inspection_records,
)

router = APIRouter(prefix="/api/inspections", tags=["验收管理"])


@router.get("", response_model=PaginatedResponse)
async def list_inspection_tasks(
    page: int = 1,
    page_size: int = 10,
    contract_id: Optional[int] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await get_inspection_tasks(
        db, page=page, page_size=page_size, contract_id=contract_id, status=status
    )


@router.post(
    "", response_model=InspectionTaskResponse, status_code=status.HTTP_201_CREATED
)
async def create_new_inspection_task(
    data: InspectionTaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await create_inspection_task(db, data)


@router.put("/{task_id}/status", response_model=InspectionTaskResponse)
async def update_inspection_status(
    task_id: int,
    data: InspectionTaskStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = await get_inspection_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="验收任务不存在")
    return await update_task_status(db, task, data)


@router.post(
    "/{task_id}/record",
    response_model=InspectionRecordResponse,
    status_code=status.HTTP_201_CREATED,
)
async def submit_inspection_record(
    task_id: int,
    data: InspectionRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = await get_inspection_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="验收任务不存在")
    return await create_inspection_record(db, task_id, data)
