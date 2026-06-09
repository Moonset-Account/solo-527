from __future__ import annotations

from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks

from app.data.models import ModelStatus
from app.schemas.model import ModelVersionCreate, ModelVersionOut
from app.schemas.common import ModelStatus as ModelStatusSchema
from app.services.indexing_service import IndexingService
from app.api.deps import get_indexing_service, get_current_user_id

router = APIRouter(tags=["Indexing & Models"])


# ========= Model Versions =========

@router.post("/model-versions", response_model=ModelVersionOut, status_code=status.HTTP_201_CREATED)
def create_model_version(
    obj_in: ModelVersionCreate,
    background_tasks: BackgroundTasks,
    svc: IndexingService = Depends(get_indexing_service),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    try:
        return svc.create_model_version(obj_in, created_by=user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/model-versions", response_model=dict)
def list_model_versions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    status: Optional[ModelStatusSchema] = None,
    svc: IndexingService = Depends(get_indexing_service),
):
    items, total = svc.list_model_versions(page=page, page_size=page_size, status=status)
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/model-versions/default", response_model=ModelVersionOut)
def get_default_model_version(
    svc: IndexingService = Depends(get_indexing_service),
):
    obj = svc.get_default_model_version()
    if not obj:
        raise HTTPException(status_code=404, detail="No default model version configured")
    return obj


@router.get("/model-versions/{version_id}", response_model=ModelVersionOut)
def get_model_version(
    version_id: Optional[int] = None,
    tag: Optional[str] = Query(None, description="按版本标签查询"),
    svc: IndexingService = Depends(get_indexing_service),
):
    obj = svc.get_model_version(obj_id=version_id, version_tag=tag)
    if not obj:
        raise HTTPException(status_code=404, detail="ModelVersion not found")
    return obj


@router.put("/model-versions/default/{version_tag}", response_model=ModelVersionOut)
def set_default_model(
    version_tag: str,
    svc: IndexingService = Depends(get_indexing_service),
):
    try:
        obj = svc.set_default_model(version_tag)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not obj:
        raise HTTPException(status_code=404, detail="ModelVersion not found")
    return obj


@router.patch("/model-versions/{version_id}/status", response_model=ModelVersionOut)
def update_model_status(
    version_id: int,
    status: ModelStatusSchema,
    svc: IndexingService = Depends(get_indexing_service),
):
    obj = svc.update_model_status(version_id, status)
    if not obj:
        raise HTTPException(status_code=404, detail="ModelVersion not found")
    return obj


# ========= Index Build (Training) =========

@router.post("/index/build", response_model=dict, status_code=status.HTTP_202_ACCEPTED)
def start_index_build(
    model_version_tag: str = Query(..., description="目标模型版本标签（训练后的版本将发布到此标签）"),
    dataset_version_id: Optional[int] = Query(None),
    data_source_id: Optional[int] = Query(None),
    data_version: Optional[str] = Query(None),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    svc: IndexingService = Depends(get_indexing_service),
):
    """训练侧API：启动索引构建任务。这是一个同步阻塞任务，生产环境建议改为异步队列。"""
    try:
        job = svc.start_index_build(
            model_version_tag=model_version_tag,
            dataset_version_id=dataset_version_id,
            data_source_id=data_source_id,
            data_version=data_version,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "job_id": job.id,
        "status": job.status,
        "model_version_id": job.model_version_id,
        "dataset_version_id": job.dataset_version_id,
        "document_count": job.document_count,
        "indexed_count": job.indexed_count,
        "failed_count": job.failed_count,
        "started_at": job.started_at,
        "finished_at": job.finished_at,
        "error_message": job.error_message,
    }


@router.get("/index/jobs", response_model=dict)
def list_index_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    model_version_id: Optional[int] = None,
    status: Optional[str] = None,
    svc: IndexingService = Depends(get_indexing_service),
):
    items, total = svc.list_index_jobs(
        page=page, page_size=page_size, model_version_id=model_version_id, status=status,
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/index/jobs/{job_id}", response_model=dict)
def get_index_job(
    job_id: int,
    svc: IndexingService = Depends(get_indexing_service),
):
    job = svc.get_index_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Index job not found")
    return {
        "job_id": job.id,
        "status": job.status,
        "model_version_id": job.model_version_id,
        "dataset_version_id": job.dataset_version_id,
        "document_count": job.document_count,
        "indexed_count": job.indexed_count,
        "failed_count": job.failed_count,
        "started_at": job.started_at,
        "finished_at": job.finished_at,
        "error_message": job.error_message,
        "config": job.config,
    }
