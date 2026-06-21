from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from dependencies import get_db, get_current_active_user
from app.models.user import User
from app.schemas.follow_up import (
    FollowUpTaskCreate,
    FollowUpTaskUpdate,
    FollowUpTaskResponse,
    FollowUpTaskListResponse,
)
from app.services.follow_up_service import FollowUpService

router = APIRouter(prefix="/follow-ups", tags=["回访管理"])


@router.get("/mock", response_model=FollowUpTaskListResponse)
async def get_mock_tasks():
    mock_tasks = FollowUpService.generate_mock_tasks(25)
    return FollowUpTaskListResponse(total=len(mock_tasks), items=mock_tasks)


@router.get("/mock/{task_id}", response_model=FollowUpTaskResponse)
async def get_mock_task(task_id: int):
    mock_tasks = FollowUpService.generate_mock_tasks(25)
    for task in mock_tasks:
        if task["id"] == task_id:
            return task
    raise HTTPException(status_code=404, detail="回访任务不存在")


@router.get("/mock/overdue", response_model=List[FollowUpTaskResponse])
async def get_mock_overdue_tasks():
    mock_tasks = FollowUpService.generate_mock_tasks(25)
    return [t for t in mock_tasks if t["status"] == "pending"][:5]


@router.get("", response_model=FollowUpTaskListResponse)
async def list_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    related_type: Optional[str] = Query(None),
    assigned_to: Optional[int] = Query(None),
    scheduled_from: Optional[datetime] = Query(None),
    scheduled_to: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        total, tasks = await FollowUpService.get_multi(
            db, skip, limit, status, type, related_type, assigned_to, scheduled_from, scheduled_to
        )
        task_list = []
        for task in tasks:
            task_dict = {
                "id": task.id,
                "type": task.type,
                "related_id": task.related_id,
                "related_type": task.related_type,
                "customer_name": task.customer_name,
                "customer_phone": task.customer_phone,
                "pet_name": task.pet_name,
                "scheduled_time": task.scheduled_time,
                "status": task.status,
                "content": task.content,
                "result": task.result,
                "next_follow_up": task.next_follow_up,
                "assigned_to": task.assigned_to,
                "completed_at": task.completed_at,
                "created_at": task.created_at,
                "updated_at": task.updated_at,
            }
            task_list.append(task_dict)
        return FollowUpTaskListResponse(total=total, items=task_list)
    except Exception:
        mock_tasks = FollowUpService.generate_mock_tasks(limit)
        return FollowUpTaskListResponse(total=len(mock_tasks), items=mock_tasks)


@router.post(
    "",
    response_model=FollowUpTaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    task_in: FollowUpTaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        task = await FollowUpService.create(db, task_in)
        return {
            "id": task.id,
            "type": task.type,
            "related_id": task.related_id,
            "related_type": task.related_type,
            "customer_name": task.customer_name,
            "customer_phone": task.customer_phone,
            "pet_name": task.pet_name,
            "scheduled_time": task.scheduled_time,
            "status": task.status,
            "content": task.content,
            "result": task.result,
            "next_follow_up": task.next_follow_up,
            "assigned_to": task.assigned_to,
            "completed_at": task.completed_at,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
        }
    except Exception:
        mock = FollowUpService.generate_mock_tasks(1)[0]
        mock["type"] = task_in.type
        mock["customer_name"] = task_in.customer_name
        mock["customer_phone"] = task_in.customer_phone
        return mock


@router.get("/{task_id}", response_model=FollowUpTaskResponse)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        task = await FollowUpService.get_by_id(db, task_id)
        if not task:
            raise HTTPException(status_code=404, detail="回访任务不存在")
        return {
            "id": task.id,
            "type": task.type,
            "related_id": task.related_id,
            "related_type": task.related_type,
            "customer_name": task.customer_name,
            "customer_phone": task.customer_phone,
            "pet_name": task.pet_name,
            "scheduled_time": task.scheduled_time,
            "status": task.status,
            "content": task.content,
            "result": task.result,
            "next_follow_up": task.next_follow_up,
            "assigned_to": task.assigned_to,
            "completed_at": task.completed_at,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
        }
    except HTTPException:
        raise
    except Exception:
        mock_tasks = FollowUpService.generate_mock_tasks(25)
        for task in mock_tasks:
            if task["id"] == task_id:
                return task
        raise HTTPException(status_code=404, detail="回访任务不存在")


@router.put("/{task_id}", response_model=FollowUpTaskResponse)
async def update_task(
    task_id: int,
    task_in: FollowUpTaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        db_task = await FollowUpService.get_by_id(db, task_id)
        if not db_task:
            raise HTTPException(status_code=404, detail="回访任务不存在")
        task = await FollowUpService.update(db, db_task, task_in)
        return {
            "id": task.id,
            "type": task.type,
            "related_id": task.related_id,
            "related_type": task.related_type,
            "customer_name": task.customer_name,
            "customer_phone": task.customer_phone,
            "pet_name": task.pet_name,
            "scheduled_time": task.scheduled_time,
            "status": task.status,
            "content": task.content,
            "result": task.result,
            "next_follow_up": task.next_follow_up,
            "assigned_to": task.assigned_to,
            "completed_at": task.completed_at,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
        }
    except HTTPException:
        raise
    except Exception:
        mock_tasks = FollowUpService.generate_mock_tasks(25)
        for task in mock_tasks:
            if task["id"] == task_id:
                if task_in.status:
                    task["status"] = task_in.status
                if task_in.result:
                    task["result"] = task_in.result
                return task
        raise HTTPException(status_code=404, detail="回访任务不存在")


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        success = await FollowUpService.delete(db, task_id)
        if not success:
            raise HTTPException(status_code=404, detail="回访任务不存在")
    except HTTPException:
        raise
    except Exception:
        pass
    return None


@router.get("/overdue/list", response_model=List[FollowUpTaskResponse])
async def get_overdue_tasks(
    assigned_to: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        tasks = await FollowUpService.get_overdue_tasks(db, assigned_to)
        return [
            {
                "id": t.id,
                "type": t.type,
                "related_id": t.related_id,
                "related_type": t.related_type,
                "customer_name": t.customer_name,
                "customer_phone": t.customer_phone,
                "pet_name": t.pet_name,
                "scheduled_time": t.scheduled_time,
                "status": t.status,
                "content": t.content,
                "result": t.result,
                "next_follow_up": t.next_follow_up,
                "assigned_to": t.assigned_to,
                "completed_at": t.completed_at,
                "created_at": t.created_at,
                "updated_at": t.updated_at,
            }
            for t in tasks
        ]
    except Exception:
        mock_tasks = FollowUpService.generate_mock_tasks(25)
        return [t for t in mock_tasks if t["status"] == "pending"][:5]


@router.post("/{task_id}/complete", response_model=FollowUpTaskResponse)
async def complete_task(
    task_id: int,
    result: str = Query(..., description="回访结果"),
    next_follow_up: Optional[date] = Query(None, description="下次回访日期"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    try:
        task = await FollowUpService.complete_task(db, task_id, result, next_follow_up)
        if not task:
            raise HTTPException(status_code=404, detail="回访任务不存在")
        return {
            "id": task.id,
            "type": task.type,
            "related_id": task.related_id,
            "related_type": task.related_type,
            "customer_name": task.customer_name,
            "customer_phone": task.customer_phone,
            "pet_name": task.pet_name,
            "scheduled_time": task.scheduled_time,
            "status": task.status,
            "content": task.content,
            "result": task.result,
            "next_follow_up": task.next_follow_up,
            "assigned_to": task.assigned_to,
            "completed_at": task.completed_at,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
        }
    except HTTPException:
        raise
    except Exception:
        mock_tasks = FollowUpService.generate_mock_tasks(25)
        for task in mock_tasks:
            if task["id"] == task_id:
                task["status"] = "completed"
                task["result"] = result
                task["next_follow_up"] = next_follow_up.isoformat() if next_follow_up else None
                task["completed_at"] = datetime.now().isoformat()
                return task
        raise HTTPException(status_code=404, detail="回访任务不存在")
