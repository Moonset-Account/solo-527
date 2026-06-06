from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.security import get_current_active_user
from app.core.exceptions import BusinessException
from app.models import (
    CleaningTask, CleaningTaskStatus, CleaningTaskPriority,
    User, UserRole, Property, RoomStatus, RoomStatusType
)
from app.schemas.cleaning_task import (
    CleaningTaskCreate, CleaningTaskUpdate, CleaningTaskResponse,
    CleaningTaskAssign, CleaningTaskSubmit, CleaningTaskReview,
    CleaningTaskQuery
)
from app.schemas.common import ApiResponse, PaginatedResponse
from app.services.task_service import TaskService
from app.core.config import settings
from app.core.logging import logger

router = APIRouter(prefix="/api/cleaning-tasks", tags=["保洁任务"])


@router.get("", response_model=PaginatedResponse[CleaningTaskResponse])
def get_cleaning_tasks(
    status: Optional[CleaningTaskStatus] = None,
    property_id: Optional[int] = None,
    cleaner_id: Optional[int] = None,
    priority: Optional[CleaningTaskPriority] = None,
    is_overdue: Optional[int] = None,
    community: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    query = db.query(CleaningTask).join(Property)

    if current_user.role == UserRole.CLEANER:
        query = query.filter(CleaningTask.cleaner_id == current_user.id)

    if status:
        query = query.filter(CleaningTask.status == status)
    if property_id:
        query = query.filter(CleaningTask.property_id == property_id)
    if cleaner_id:
        query = query.filter(CleaningTask.cleaner_id == cleaner_id)
    if priority:
        query = query.filter(CleaningTask.priority == priority)
    if is_overdue is not None:
        query = query.filter(CleaningTask.is_overdue == is_overdue)
    if community:
        query = query.filter(Property.community == community)
    if start_date:
        query = query.filter(CleaningTask.created_at >= start_date)
    if end_date:
        query = query.filter(CleaningTask.created_at <= end_date)

    total = query.count()
    tasks = query.order_by(CleaningTask.id.desc()).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedResponse(
        data=[CleaningTaskResponse.model_validate(t) for t in tasks],
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{task_id}", response_model=ApiResponse[CleaningTaskResponse])
def get_cleaning_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    task = db.query(CleaningTask).filter(CleaningTask.id == task_id).first()
    if not task:
        raise BusinessException("保洁任务不存在")
    if current_user.role == UserRole.CLEANER and task.cleaner_id != current_user.id:
        raise BusinessException("无权限查看此任务", code=403)
    return ApiResponse(data=CleaningTaskResponse.model_validate(task))


@router.post("", response_model=ApiResponse[CleaningTaskResponse])
def create_cleaning_task(
    task_in: CleaningTaskCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限创建任务", code=403)

    property_obj = db.query(Property).filter(Property.id == task_in.property_id).first()
    if not property_obj:
        raise BusinessException("房源不存在")

    task_no = TaskService.generate_task_no()
    deadline = task_in.deadline_time
    if not deadline:
        deadline = task_in.scheduled_time + timedelta(minutes=settings.CLEANING_TIMEOUT_MINUTES)

    task = CleaningTask(
        task_no=task_no,
        property_id=task_in.property_id,
        created_by=current_user.id,
        status=CleaningTaskStatus.PENDING,
        priority=task_in.priority,
        scheduled_time=task_in.scheduled_time,
        deadline_time=deadline,
        estimated_duration=task_in.estimated_duration,
        cleaning_items=task_in.cleaning_items,
        description=task_in.description
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    logger.info(f"Cleaning task {task_no} created by {current_user.username}")
    return ApiResponse(data=CleaningTaskResponse.model_validate(task))


@router.post("/{task_id}/assign", response_model=ApiResponse[CleaningTaskResponse])
def assign_cleaning_task(
    task_id: int,
    assign_in: CleaningTaskAssign,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限分配任务", code=403)

    task = TaskService.assign_cleaning_task(db, task_id, assign_in.cleaner_id, current_user.id)
    return ApiResponse(data=CleaningTaskResponse.model_validate(task))


@router.post("/{task_id}/start", response_model=ApiResponse[CleaningTaskResponse])
def start_cleaning_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    task = TaskService.start_cleaning_task(db, task_id, current_user.id)
    return ApiResponse(data=CleaningTaskResponse.model_validate(task))


@router.post("/{task_id}/submit", response_model=ApiResponse[CleaningTaskResponse])
def submit_cleaning_task(
    task_id: int,
    submit_in: CleaningTaskSubmit,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    task = TaskService.submit_cleaning_task(db, task_id, current_user.id, submit_in.description)
    return ApiResponse(data=CleaningTaskResponse.model_validate(task))


@router.post("/{task_id}/approve", response_model=ApiResponse[CleaningTaskResponse])
def approve_cleaning_task(
    task_id: int,
    review_in: CleaningTaskReview,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限验收", code=403)

    task = TaskService.approve_cleaning_task(db, task_id, current_user.id, review_in.remarks)
    return ApiResponse(data=CleaningTaskResponse.model_validate(task))


@router.post("/{task_id}/reject", response_model=ApiResponse[CleaningTaskResponse])
def reject_cleaning_task(
    task_id: int,
    review_in: CleaningTaskReview,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限驳回", code=403)
    if not review_in.remarks:
        raise BusinessException("请填写驳回原因")

    task = TaskService.reject_cleaning_task(db, task_id, current_user.id, review_in.remarks)
    return ApiResponse(data=CleaningTaskResponse.model_validate(task))


@router.post("/{task_id}/cancel", response_model=ApiResponse[CleaningTaskResponse])
def cancel_cleaning_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise BusinessException("无权限取消", code=403)

    task = db.query(CleaningTask).filter(CleaningTask.id == task_id).first()
    if not task:
        raise BusinessException("保洁任务不存在")
    if task.status in [CleaningTaskStatus.APPROVED, CleaningTaskStatus.CANCELLED]:
        raise BusinessException("当前状态不可取消")

    task.status = CleaningTaskStatus.CANCELLED
    db.commit()
    db.refresh(task)
    logger.info(f"Cleaning task {task.task_no} cancelled by {current_user.username}")
    return ApiResponse(data=CleaningTaskResponse.model_validate(task))
