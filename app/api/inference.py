from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.ticket import (
    TicketPredictResponse,
    BatchPredictRequest, BatchPredictResponse,
    InferenceBatchTaskResponse, InferenceBatchTaskListResponse,
)

router = APIRouter(prefix="/inference", tags=["推理API"])


@router.post("/ticket/{ticket_id}", response_model=TicketPredictResponse)
def predict_single_ticket(
    ticket_id: int,
    store: bool = True,
    db: Session = Depends(get_db),
):
    from app.services.inference_service import InferenceService
    result, err = InferenceService.predict_ticket(db, ticket_id, store=store)
    if err:
        raise HTTPException(status_code=400, detail=err)
    return TicketPredictResponse(**result)


@router.post("/batch", response_model=BatchPredictResponse, status_code=202)
def predict_batch(
    data: BatchPredictRequest,
    use_queue: bool = Query(False, description="是否使用异步队列"),
    created_by: Optional[str] = Query(None, description="提交人标识"),
    db: Session = Depends(get_db),
):
    from app.services.batch_task_service import BatchTaskService
    from app.models.ticket import TaskStatus
    if len(data.ticket_ids) == 0:
        raise HTTPException(status_code=400, detail="工单ID列表不能为空")
    if len(data.ticket_ids) > 1000 and not use_queue:
        raise HTTPException(
            status_code=400,
            detail=f"批量预测超过1000条请使用异步队列(use_queue=true)",
        )

    task = BatchTaskService.create(
        db, data.ticket_ids, store_predictions=data.store_predictions, created_by=created_by,
    )

    if use_queue:
        from app.core.queue import get_inference_queue
        queue = get_inference_queue()
        job = queue.enqueue(
            "app.workers.tasks.execute_batch_inference",
            task_id=task.id,
            job_timeout="2h",
        )
        BatchTaskService.update(db, task.id, job_id=job.id)
        return BatchPredictResponse(
            total=task.total_count,
            success=0,
            low_confidence_count=0,
            results=[],
            task_id=task.id,
            job_id=job.id,
            status=TaskStatus.PENDING.value,
        )

    from app.services.inference_service import InferenceService
    result = InferenceService.execute_batch_task(db, task.id)
    resp = BatchPredictResponse(
        **result,
        task_id=task.id,
        status=TaskStatus.COMPLETED.value,
    )
    return resp


@router.get("/batch", response_model=InferenceBatchTaskListResponse)
def list_batch_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, description="按状态筛选: pending/running/completed/failed"),
    db: Session = Depends(get_db),
):
    from app.services.batch_task_service import BatchTaskService
    items, total = BatchTaskService.list(db, page, page_size, status=status)
    return InferenceBatchTaskListResponse(
        items=items, total=total, page=page, page_size=page_size,
    )


@router.get("/batch/{task_id}", response_model=InferenceBatchTaskResponse)
def get_batch_task(task_id: int, db: Session = Depends(get_db)):
    from app.services.batch_task_service import BatchTaskService
    task = BatchTaskService.get(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="批量推理任务不存在")
    return task


@router.post("/process-pending")
def process_pending_queue(
    limit: int = Query(100, ge=1, le=5000),
    use_queue: bool = Query(False),
    db: Session = Depends(get_db),
):
    from app.services.inference_service import InferenceService
    if use_queue:
        from app.core.queue import get_inference_queue
        queue = get_inference_queue()
        job = queue.enqueue(
            "app.workers.tasks.execute_process_pending_queue",
            limit=limit,
            job_timeout="2h",
        )
        return {"status": "queued", "job_id": job.id, "limit": limit}

    result = InferenceService.process_pending_queue(db, limit=limit)
    return result


@router.post("/build-retriever")
def build_similar_case_index(
    limit: int = Query(5000, ge=100, le=50000),
    use_queue: bool = Query(False),
    db: Session = Depends(get_db),
):
    from app.services.inference_service import InferenceService
    if use_queue:
        from app.core.queue import get_inference_queue
        queue = get_inference_queue()
        job = queue.enqueue(
            "app.workers.tasks.execute_build_retriever",
            limit=limit,
            job_timeout="2h",
        )
        return {"status": "queued", "job_id": job.id, "limit": limit}

    InferenceService.build_retriever(db, limit=limit)
    return {"status": "success", "limit": limit, "message": "相似案例索引已重建"}
