from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.queue import get_inference_queue
from app.schemas.ticket import (
    PredictResponse, TicketPredictResponse,
    BatchPredictRequest, BatchPredictResponse,
)
from app.services.inference_service import InferenceService
from app.services.ticket_service import TicketService

router = APIRouter(prefix="/inference", tags=["推理API"])


@router.post("/ticket/{ticket_id}", response_model=TicketPredictResponse)
def predict_single_ticket(
    ticket_id: int,
    store: bool = True,
    db: Session = Depends(get_db),
):
    result, err = InferenceService.predict_ticket(db, ticket_id, store=store)
    if err:
        raise HTTPException(status_code=400, detail=err)
    return TicketPredictResponse(**result)


@router.post("/batch", response_model=BatchPredictResponse)
def predict_batch(
    data: BatchPredictRequest,
    use_queue: bool = Query(False, description="是否使用异步队列"),
    db: Session = Depends(get_db),
):
    if len(data.ticket_ids) == 0:
        raise HTTPException(status_code=400, detail="工单ID列表不能为空")
    if len(data.ticket_ids) > 1000 and not use_queue:
        raise HTTPException(
            status_code=400,
            detail=f"批量预测超过1000条请使用异步队列(use_queue=true)",
        )

    if use_queue:
        queue = get_inference_queue()
        job = queue.enqueue(
            "app.workers.tasks.execute_batch_inference",
            ticket_ids=data.ticket_ids,
            store=data.store_predictions,
            job_timeout="2h",
        )
        return BatchPredictResponse(
            total=len(data.ticket_ids),
            success=0,
            low_confidence_count=0,
            results=[],
            job_id=job.id,
            _message="任务已提交到推理队列",
        ) if False else BatchPredictResponse(
            total=len(data.ticket_ids),
            success=0,
            low_confidence_count=0,
            results=[],
        )

    result = InferenceService.predict_batch(
        db, data.ticket_ids, store=data.store_predictions,
    )
    return BatchPredictResponse(**result)


@router.post("/process-pending")
def process_pending_queue(
    limit: int = Query(100, ge=1, le=5000),
    use_queue: bool = Query(False),
    db: Session = Depends(get_db),
):
    if use_queue:
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
    if use_queue:
        queue = get_inference_queue()
        job = queue.enqueue(
            "app.workers.tasks.execute_build_retriever",
            limit=limit,
            job_timeout="2h",
        )
        return {"status": "queued", "job_id": job.id, "limit": limit}

    InferenceService.build_retriever(db, limit=limit)
    return {"status": "success", "limit": limit, "message": "相似案例索引已重建"}
