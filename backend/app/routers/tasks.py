from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


@router.get("/board", response_model=schemas.TaskBoardResponse)
def get_task_board(
    filter_date: Optional[date] = Query(None, description="筛选日期，默认今天"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_all_authenticated)
):
    target_date = filter_date or date.today()
    start_of_day = datetime.combine(target_date, datetime.min.time())
    end_of_day = datetime.combine(target_date, datetime.max.time())

    if current_user.role in [models.UserRole.ADMIN, models.UserRole.COACH]:
        base_query = db.query(models.Task)
    else:
        base_query = db.query(models.Task).filter(
            (models.Task.assigned_user_id == current_user.id) |
            (models.Task.assigned_user_id.is_(None))
        )

    date_filter = (
        (func.date(models.Task.created_at) == target_date) |
        (func.date(models.Task.updated_at) == target_date) |
        (func.date(models.Task.due_date) == target_date)
    )

    query = base_query.filter(date_filter)

    new_tasks = query.filter(models.Task.status == models.TaskStatus.NEW).order_by(models.Task.priority.desc()).all()
    pending_confirm = query.filter(models.Task.status == models.TaskStatus.PENDING_CONFIRM).order_by(models.Task.priority.desc()).all()
    in_progress = query.filter(models.Task.status == models.TaskStatus.IN_PROGRESS).order_by(models.Task.priority.desc()).all()
    exception_review = query.filter(models.Task.status == models.TaskStatus.EXCEPTION_REVIEW).order_by(models.Task.priority.desc()).all()

    archived_query = base_query.filter(
        models.Task.status == models.TaskStatus.ARCHIVED,
        func.date(models.Task.updated_at) == target_date
    ).order_by(models.Task.updated_at.desc()).limit(20).all()

    return schemas.TaskBoardResponse(
        new=new_tasks,
        pending_confirm=pending_confirm,
        in_progress=in_progress,
        exception_review=exception_review,
        archived=archived_query
    )


@router.get("/", response_model=List[schemas.TaskResponse])
def list_tasks(
    status: models.TaskStatus = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_all_authenticated)
):
    query = db.query(models.Task)
    if current_user.role == models.UserRole.RUNNER:
        query = query.filter(models.Task.assigned_user_id == current_user.id)
    if status:
        query = query.filter(models.Task.status == status)
    tasks = query.offset(skip).limit(limit).all()
    return tasks


@router.post("/", response_model=schemas.TaskResponse)
def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_coach)
):
    db_task = models.Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.patch("/{task_id}", response_model=schemas.TaskResponse)
def update_task(
    task_id: int,
    task_update: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_all_authenticated)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if current_user.role == models.UserRole.RUNNER and task.assigned_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
    for key, value in task_update.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=schemas.TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.allow_all_authenticated)
):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if current_user.role == models.UserRole.RUNNER and task.assigned_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this task")
    return task
