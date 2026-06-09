from __future__ import annotations

from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.data.models import DataSourceType, DocumentStatus
from app.schemas.data import (
    DataSourceCreate, DataSourceOut, DataSourceUpdate,
    DocumentCreate, DocumentOut, DocumentUpdate, DocumentBatchCreate,
    DocumentReviewCreate, DocumentReviewOut,
    DatasetVersionCreate, DatasetVersionOut, CleaningReport
)
from app.schemas.common import DataSourceType as DataSourceTypeSchema, DocumentStatus as DocumentStatusSchema
from app.services.data_service import DataManagementService
from app.api.deps import get_data_service, get_current_user_id

router = APIRouter(tags=["Data Management"])


# ========= DataSource =========

@router.post("/data-sources", response_model=DataSourceOut, status_code=status.HTTP_201_CREATED)
def create_data_source(
    obj_in: DataSourceCreate,
    svc: DataManagementService = Depends(get_data_service),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    return svc.create_data_source(obj_in, created_by=user_id)


@router.get("/data-sources", response_model=dict)
def list_data_sources(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    source_type: Optional[DataSourceTypeSchema] = None,
    is_active: Optional[bool] = None,
    svc: DataManagementService = Depends(get_data_service),
):
    items, total = svc.list_data_sources(
        page=page, page_size=page_size, source_type=source_type, is_active=is_active
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/data-sources/{source_id}", response_model=DataSourceOut)
def get_data_source(
    source_id: int,
    svc: DataManagementService = Depends(get_data_service),
):
    obj = svc.get_data_source(source_id)
    if not obj:
        raise HTTPException(status_code=404, detail="DataSource not found")
    return obj


@router.patch("/data-sources/{source_id}", response_model=DataSourceOut)
def update_data_source(
    source_id: int,
    obj_in: DataSourceUpdate,
    svc: DataManagementService = Depends(get_data_service),
):
    obj = svc.update_data_source(source_id, obj_in)
    if not obj:
        raise HTTPException(status_code=404, detail="DataSource not found")
    return obj


@router.delete("/data-sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_data_source(
    source_id: int,
    svc: DataManagementService = Depends(get_data_service),
):
    if not svc.delete_data_source(source_id):
        raise HTTPException(status_code=404, detail="DataSource not found")
    return None


# ========= Documents =========

@router.post("/documents", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def create_document(
    obj_in: DocumentCreate,
    svc: DataManagementService = Depends(get_data_service),
):
    try:
        return svc.create_document(obj_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/documents/batch", response_model=List[DocumentOut], status_code=status.HTTP_201_CREATED)
def batch_create_documents(
    obj_in: DocumentBatchCreate,
    svc: DataManagementService = Depends(get_data_service),
):
    try:
        return svc.batch_create_documents(obj_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/documents", response_model=dict)
def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    data_source_id: Optional[int] = None,
    status: Optional[DocumentStatusSchema] = None,
    data_version: Optional[str] = None,
    svc: DataManagementService = Depends(get_data_service),
):
    items, total = svc.list_documents(
        page=page, page_size=page_size,
        data_source_id=data_source_id, status=status, data_version=data_version,
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/documents/stats", response_model=dict)
def get_document_stats(
    data_source_id: Optional[int] = None,
    svc: DataManagementService = Depends(get_data_service),
):
    return svc.get_document_stats(data_source_id=data_source_id)


@router.get("/documents/{doc_id}", response_model=DocumentOut)
def get_document(
    doc_id: int,
    svc: DataManagementService = Depends(get_data_service),
):
    obj = svc.get_document(doc_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Document not found")
    return obj


@router.patch("/documents/{doc_id}", response_model=DocumentOut)
def update_document(
    doc_id: int,
    obj_in: DocumentUpdate,
    svc: DataManagementService = Depends(get_data_service),
):
    obj = svc.update_document(doc_id, obj_in)
    if not obj:
        raise HTTPException(status_code=404, detail="Document not found")
    return obj


# ========= Cleaning Pipeline =========

@router.post("/pipeline/clean", response_model=CleaningReport)
def run_cleaning_pipeline(
    data_source_id: Optional[int] = Query(None, description="按数据源过滤，空表示处理全部RAW状态文档"),
    document_ids: Optional[List[int]] = Query(None),
    auto_approve_threshold: float = Query(0.7, ge=0.0, le=1.0),
    svc: DataManagementService = Depends(get_data_service),
):
    return svc.clean_documents(
        data_source_id=data_source_id,
        document_ids=document_ids,
        auto_approve_threshold=auto_approve_threshold,
    )


# ========= Document Review =========

@router.post("/documents/{doc_id}/reviews", response_model=DocumentOut)
def review_document(
    doc_id: int,
    obj_in: DocumentReviewCreate,
    svc: DataManagementService = Depends(get_data_service),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    reviewer = user_id or "anonymous"
    obj = svc.review_document(doc_id, obj_in, reviewer=reviewer)
    if not obj:
        raise HTTPException(status_code=404, detail="Document not found")
    return obj


@router.get("/documents/{doc_id}/reviews", response_model=List[DocumentReviewOut])
def list_document_reviews(
    doc_id: int,
    svc: DataManagementService = Depends(get_data_service),
):
    doc = svc.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return svc.list_reviews(doc_id)


# ========= Dataset Versions =========

@router.post("/dataset-versions", response_model=DatasetVersionOut, status_code=status.HTTP_201_CREATED)
def create_dataset_version(
    obj_in: DatasetVersionCreate,
    svc: DataManagementService = Depends(get_data_service),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    try:
        return svc.create_dataset_version(obj_in, created_by=user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/dataset-versions", response_model=dict)
def list_dataset_versions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    data_source_id: Optional[int] = None,
    svc: DataManagementService = Depends(get_data_service),
):
    items, total = svc.list_dataset_versions(
        page=page, page_size=page_size, data_source_id=data_source_id,
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/dataset-versions/{version_id}", response_model=DatasetVersionOut)
def get_dataset_version(
    version_id: int,
    svc: DataManagementService = Depends(get_data_service),
):
    obj = svc.get_dataset_version(version_id)
    if not obj:
        raise HTTPException(status_code=404, detail="DatasetVersion not found")
    return obj
