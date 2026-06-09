from __future__ import annotations

from typing import Optional, List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse

from app.data.models import FeedbackType
from app.schemas.feedback import (
    QAFeedbackCreate, QAFeedbackOut,
    ErrorSampleCreate, ErrorSampleUpdate, ErrorSampleOut
)
from app.schemas.common import FeedbackType as FeedbackTypeSchema
from app.services.feedback_service import FeedbackService
from app.api.deps import get_feedback_service, get_current_user_id

router = APIRouter(tags=["Feedback & Error Samples"])


# ========= QA Feedback =========

@router.post("/qa/{conv_id}/feedback", response_model=QAFeedbackOut, status_code=status.HTTP_201_CREATED)
def submit_qa_feedback(
    conv_id: int,
    obj_in: QAFeedbackCreate,
    svc: FeedbackService = Depends(get_feedback_service),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    """对某次问答结果进行反馈，支持自动入库为错误样本。"""
    try:
        return svc.submit_feedback(conv_id, obj_in, user_id=user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/feedbacks", response_model=dict)
def list_feedbacks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    feedback_type: Optional[FeedbackTypeSchema] = None,
    is_error_sample: Optional[bool] = None,
    resolved: Optional[bool] = None,
    svc: FeedbackService = Depends(get_feedback_service),
):
    items, total = svc.list_feedbacks(
        page=page, page_size=page_size,
        feedback_type=feedback_type,
        is_error_sample=is_error_sample,
        resolved=resolved,
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/feedbacks/{fb_id}", response_model=QAFeedbackOut)
def get_feedback(
    fb_id: int,
    svc: FeedbackService = Depends(get_feedback_service),
):
    obj = svc.get_feedback(fb_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return obj


@router.put("/feedbacks/{fb_id}/resolve", response_model=QAFeedbackOut)
def resolve_feedback(
    fb_id: int,
    resolution_note: Optional[str] = None,
    svc: FeedbackService = Depends(get_feedback_service),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    resolver = user_id or "system"
    obj = svc.resolve_feedback(fb_id, resolved_by=resolver, resolution_note=resolution_note)
    if not obj:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return obj


# ========= Error Samples =========

@router.post("/error-samples", response_model=ErrorSampleOut, status_code=status.HTTP_201_CREATED)
def create_error_sample(
    obj_in: ErrorSampleCreate,
    svc: FeedbackService = Depends(get_feedback_service),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    return svc.create_error_sample(obj_in, created_by=user_id)


@router.get("/error-samples", response_model=dict)
def list_error_samples(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    status: Optional[str] = Query(None, description="open/in_progress/resolved/archived"),
    error_category: Optional[str] = None,
    severity: Optional[str] = None,
    model_version: Optional[str] = None,
    svc: FeedbackService = Depends(get_feedback_service),
):
    items, total = svc.list_error_samples(
        page=page, page_size=page_size,
        status=status, error_category=error_category,
        severity=severity, model_version=model_version,
    )
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/error-samples/stats/top-categories", response_model=List[Dict[str, Any]])
def get_top_error_categories(
    limit: int = Query(10, ge=1, le=100),
    days: int = Query(30, ge=1, le=365),
    svc: FeedbackService = Depends(get_feedback_service),
):
    return svc.get_top_error_categories(limit=limit, days=days)


@router.get("/error-samples/{sample_id}", response_model=ErrorSampleOut)
def get_error_sample(
    sample_id: int,
    svc: FeedbackService = Depends(get_feedback_service),
):
    obj = svc.get_error_sample(sample_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Error sample not found")
    return obj


@router.patch("/error-samples/{sample_id}", response_model=ErrorSampleOut)
def update_error_sample(
    sample_id: int,
    obj_in: ErrorSampleUpdate,
    svc: FeedbackService = Depends(get_feedback_service),
):
    obj = svc.update_error_sample(sample_id, obj_in)
    if not obj:
        raise HTTPException(status_code=404, detail="Error sample not found")
    return obj


@router.get("/error-samples/export/json")
def export_error_samples(
    status: Optional[str] = Query(None),
    limit: int = Query(1000, ge=1, le=100000),
    svc: FeedbackService = Depends(get_feedback_service),
):
    data = svc.export_error_samples(status=status, limit=limit)
    return JSONResponse(
        content={
            "count": len(data),
            "exported_at": svc.err_repo.db.execute(
                "SELECT datetime('now')" if True else "SELECT NOW()"
            ).scalar() if False else None,
            "samples": data,
        }
    )
