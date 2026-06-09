from __future__ import annotations

import asyncio
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_db, get_current_user
from app.config import get_settings
from app.models.task import (
    Task,
    TaskResult,
    TaskType,
    TaskStatus,
    TaskPriority,
)
from app.models.user import User
from app.schemas.task import (
    TaskDetail,
    TaskInfo,
    TaskListFilter,
    TaskRetryRequest,
    TaskProgressEvent,
    TaskResultInfo,
)
from app.schemas.base import BaseResponse, PageResponse, MessageResponse, IdResponse

router = APIRouter(prefix="/tasks", tags=["Tasks"])
settings = get_settings()


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, task_id: int, websocket: WebSocket):
        await websocket.accept()
        if task_id not in self.active_connections:
            self.active_connections[task_id] = []
        self.active_connections[task_id].append(websocket)

    def disconnect(self, task_id: int, websocket: WebSocket):
        if task_id in self.active_connections:
            if websocket in self.active_connections[task_id]:
                self.active_connections[task_id].remove(websocket)
            if not self.active_connections[task_id]:
                del self.active_connections[task_id]

    async def broadcast(self, task_id: int, message: Dict[str, Any]):
        if task_id in self.active_connections:
            dead_conns = []
            for conn in self.active_connections[task_id]:
                try:
                    await conn.send_json(message)
                except Exception:
                    dead_conns.append(conn)
            for dead in dead_conns:
                self.disconnect(task_id, dead)


manager = ConnectionManager()


def _task_to_detail(task: Task, results: Optional[List[TaskResult]] = None) -> TaskDetail:
    info = TaskInfo.model_validate(task)
    task_results = results or task.results or []
    result_infos = [TaskResultInfo.model_validate(r) for r in task_results]
    return TaskDetail(**info.model_dump(), results=result_infos)


@router.get("/{task_id}", response_model=BaseResponse[TaskDetail])
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BaseResponse[TaskDetail]:
    result = await db.execute(
        select(Task)
        .options(selectinload(Task.results))
        .where(Task.id == task_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    detail = _task_to_detail(task)
    return BaseResponse(data=detail, request_id=str(uuid.uuid4()))


@router.get("", response_model=BaseResponse[PageResponse[TaskInfo]])
async def list_tasks(
    task_type: Optional[TaskType] = Query(None, description="任务类型过滤"),
    status: Optional[TaskStatus] = Query(None, description="任务状态过滤"),
    priority: Optional[TaskPriority] = Query(None, description="优先级过滤"),
    creator_id: Optional[int] = Query(None, description="创建人ID"),
    assignee_id: Optional[int] = Query(None, description="分配人ID"),
    contract_id: Optional[int] = Query(None, description="关联合同ID"),
    dataset_id: Optional[int] = Query(None, description="关联数据集ID"),
    model_id: Optional[int] = Query(None, description="关联模型ID"),
    date_from: Optional[datetime] = Query(None, description="起始时间"),
    date_to: Optional[datetime] = Query(None, description="结束时间"),
    keyword: Optional[str] = Query(None, description="标题关键词"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BaseResponse[PageResponse[TaskInfo]]:
    query = select(Task)
    conditions = []

    if task_type:
        conditions.append(Task.task_type == task_type)
    if status:
        conditions.append(Task.status == status)
    if priority:
        conditions.append(Task.priority == priority)
    if creator_id:
        conditions.append(Task.creator_id == creator_id)
    if assignee_id:
        conditions.append(Task.assignee_id == assignee_id)
    if contract_id:
        conditions.append(Task.contract_id == contract_id)
    if dataset_id:
        conditions.append(Task.dataset_id == dataset_id)
    if model_id:
        conditions.append(Task.model_id == model_id)
    if date_from:
        conditions.append(Task.created_at >= date_from)
    if date_to:
        conditions.append(Task.created_at <= date_to)
    if keyword:
        like = f"%{keyword}%"
        conditions.append(Task.title.ilike(like))

    if conditions:
        query = query.where(and_(*conditions))

    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one() or 0

    query = query.order_by(Task.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    items = [TaskInfo.model_validate(t) for t in result.scalars().all()]

    page_resp = PageResponse[TaskInfo](
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if page_size else 0,
    )
    return BaseResponse(data=page_resp, request_id=str(uuid.uuid4()))


@router.post("/{task_id}/cancel", response_model=BaseResponse[TaskInfo])
async def cancel_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BaseResponse[TaskInfo]:
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    if task.status in (TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELED):
        raise HTTPException(status_code=400, detail=f"任务状态为{task.status.value}，无法取消")

    if task.celery_task_id:
        try:
            from celery.result import AsyncResult
            from app.core.celery_app import celery_app

            async_result = AsyncResult(task.celery_task_id, app=celery_app)
            async_result.revoke(terminate=True, signal="SIGTERM")
        except Exception:
            pass

    task.status = TaskStatus.CANCELED
    task.completed_at = datetime.utcnow()
    await db.commit()
    await db.refresh(task)

    progress_msg = {
        "task_id": task.id,
        "status": task.status.value,
        "progress_percent": task.progress_percent,
        "progress_message": "任务已取消",
        "timestamp": datetime.utcnow().isoformat(),
    }
    asyncio.create_task(manager.broadcast(task.id, progress_msg))

    return BaseResponse(data=TaskInfo.model_validate(task), request_id=str(uuid.uuid4()))


@router.post("/{task_id}/retry", response_model=BaseResponse[IdResponse])
async def retry_task(
    task_id: int,
    body: TaskRetryRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BaseResponse[IdResponse]:
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    if not body.force and task.status not in (TaskStatus.FAILED, TaskStatus.CANCELED, TaskStatus.TIMEOUT):
        raise HTTPException(status_code=400, detail=f"任务状态为{task.status.value}，无法重试")

    if task.retry_count >= task.max_retries and not body.force:
        raise HTTPException(status_code=400, detail=f"已达到最大重试次数({task.max_retries})，请使用force=true强制重试")

    new_params = task.params or {}
    if body.new_params:
        new_params.update(body.new_params)

    retry_count = task.retry_count + 1
    new_task = Task(
        task_type=task.task_type,
        status=TaskStatus.PENDING,
        priority=task.priority,
        contract_id=task.contract_id,
        dataset_id=task.dataset_id,
        model_id=task.model_id,
        ab_run_id=task.ab_run_id,
        creator_id=current_user.id,
        assignee_id=task.assignee_id,
        title=f"{task.title} - 重试#{retry_count}" if task.title else None,
        params=new_params,
        config=task.config,
        retry_count=retry_count,
        max_retries=task.max_retries,
        timeout_seconds=task.timeout_seconds,
        tags=task.tags,
        metadata={"retry_of_task_id": task.id, **(task.metadata or {})} if task.metadata else {"retry_of_task_id": task.id},
    )
    db.add(new_task)
    await db.flush()

    task.status = TaskStatus.RETRYING
    task.retry_count = retry_count
    await db.commit()
    await db.refresh(new_task)

    return BaseResponse(data=IdResponse(id=new_task.id), request_id=str(uuid.uuid4()))


@router.websocket("/ws/{task_id}/progress")
async def websocket_task_progress(
    websocket: WebSocket,
    task_id: int,
    token: Optional[str] = None,
):
    await manager.connect(task_id, websocket)
    try:
        initial_msg = {
            "task_id": task_id,
            "status": "connected",
            "progress_percent": 0.0,
            "progress_message": "已连接，等待进度更新",
            "timestamp": datetime.utcnow().isoformat(),
        }
        await websocket.send_json(initial_msg)

        last_progress = 0.0
        while True:
            await asyncio.sleep(2)
            try:
                from app.core.database import async_session_factory

                async with async_session_factory() as tmp_db:
                    r = await tmp_db.execute(select(Task).where(Task.id == task_id))
                    t = r.scalar_one_or_none()
                    if t and t.progress_percent != last_progress:
                        last_progress = t.progress_percent
                        evt = TaskProgressEvent(
                            task_id=t.id,
                            status=t.status,
                            progress_percent=t.progress_percent,
                            progress_message=t.progress_message,
                            progress_detail=t.progress_detail,
                            timestamp=datetime.utcnow(),
                        )
                        await websocket.send_json(evt.model_dump(mode="json"))
                        if t.status in (
                            TaskStatus.COMPLETED,
                            TaskStatus.FAILED,
                            TaskStatus.CANCELED,
                            TaskStatus.TIMEOUT,
                        ):
                            break
            except Exception:
                break

    except WebSocketDisconnect:
        manager.disconnect(task_id, websocket)
    finally:
        manager.disconnect(task_id, websocket)


@router.get("/{task_id}/poll", response_model=BaseResponse[TaskProgressEvent])
async def poll_task_progress(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BaseResponse[TaskProgressEvent]:
    result = await db.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="任务不存在")

    evt = TaskProgressEvent(
        task_id=task.id,
        status=task.status,
        progress_percent=task.progress_percent,
        progress_message=task.progress_message,
        progress_detail=task.progress_detail,
        timestamp=datetime.utcnow(),
    )
    return BaseResponse(data=evt, request_id=str(uuid.uuid4()))
