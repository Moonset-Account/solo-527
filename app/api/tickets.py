from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.ticket import (
    CategoryCreate, CategoryUpdate, CategoryResponse,
    TicketCreate, TicketUpdate, TicketResponse, TicketListResponse,
    AnnotationCreate, AnnotationResponse,
    BatchConfirmRequest, BatchConfirmResponse,
    ErrorSampleResponse, ErrorSampleListResponse, TicketImport,
)
from app.services.ticket_service import (
    CategoryService, TicketService, AnnotationService, ErrorSampleService,
)
from app.services.inference_service import StatsService
from app.models.ticket import TicketStatus

router = APIRouter(prefix="/categories", tags=["分类管理"])


@router.get("", response_model=List[CategoryResponse])
def list_categories(
    active_only: bool = True,
    db: Session = Depends(get_db),
):
    return CategoryService.get_all(db, active_only=active_only)


@router.post("", response_model=CategoryResponse, status_code=201)
def create_category(data: CategoryCreate, db: Session = Depends(get_db)):
    if CategoryService.get_by_code(db, data.code):
        raise HTTPException(status_code=400, detail=f"分类编码 {data.code} 已存在")
    return CategoryService.create(db, data)


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = CategoryService.get_by_id(db, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="分类不存在")
    return category


@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: int, data: CategoryUpdate, db: Session = Depends(get_db),
):
    category = CategoryService.update(db, category_id, data)
    if not category:
        raise HTTPException(status_code=404, detail="分类不存在")
    return category


tickets_router = APIRouter(prefix="/tickets", tags=["工单管理"])


def _build_ticket_response(t, db: Session) -> dict:
    return {
        "id": t.id, "ticket_no": t.ticket_no, "title": t.title,
        "content": t.content, "channel": t.channel,
        "process_result": t.process_result,
        "refund_status": t.refund_status,
        "refund_amount": t.refund_amount,
        "category_id": t.category_id,
        "category_name": t.category.name if t.category else None,
        "predicted_category_id": t.predicted_category_id,
        "predicted_category_name": (
            t.predicted_category.name if t.predicted_category else None
        ),
        "confidence": t.confidence,
        "status": t.status,
        "model_version_id": t.model_version_id,
        "model_version_tag": (
            t.model_version.version_tag if t.model_version else None
        ),
        "is_error_case": t.is_error_case,
        "error_source_id": t.error_source_id,
        "created_at": t.created_at,
        "updated_at": t.updated_at,
        "confirmed_at": t.confirmed_at,
        "annotations": t.annotations,
        "similar_cases": TicketService.get_similar_cases(db, t.id),
    }


@tickets_router.get("", response_model=TicketListResponse)
def list_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    status: Optional[str] = None,
    channel: Optional[str] = None,
    category_id: Optional[int] = None,
    predicted_category_id: Optional[int] = None,
    is_error_case: Optional[bool] = None,
    low_confidence_only: bool = False,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
):
    items, total = TicketService.list(
        db, page, page_size, status=status, channel=channel,
        category_id=category_id, predicted_category_id=predicted_category_id,
        is_error_case=is_error_case, low_confidence_only=low_confidence_only,
        keyword=keyword,
    )
    resp_items = [_build_ticket_response(t, db) for t in items]
    return TicketListResponse(
        items=resp_items, total=total, page=page, page_size=page_size,
    )


@tickets_router.post("", response_model=TicketResponse, status_code=201)
def create_ticket(data: TicketCreate, db: Session = Depends(get_db)):
    if TicketService.get_by_no(db, data.ticket_no):
        raise HTTPException(status_code=400, detail="工单号已存在")
    t = TicketService.create(db, data)
    return _build_ticket_response(t, db)


@tickets_router.post("/bulk-import", status_code=201)
def bulk_import_tickets(data: TicketImport, db: Session = Depends(get_db)):
    try:
        created = TicketService.bulk_create(db, data.tickets)
        return {"imported": len(created), "total": len(data.tickets)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"导入失败: {str(e)}")


@tickets_router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: int, db: Session = Depends(get_db)):
    t = TicketService.get_by_id(db, ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="工单不存在")
    return _build_ticket_response(t, db)


@tickets_router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: int, data: TicketUpdate, db: Session = Depends(get_db),
):
    t = TicketService.update(db, ticket_id, data)
    if not t:
        raise HTTPException(status_code=404, detail="工单不存在")
    return _build_ticket_response(t, db)


annotations_router = APIRouter(prefix="/annotations", tags=["标注工作台"])


@annotations_router.get("/ticket/{ticket_id}", response_model=List[AnnotationResponse])
def get_ticket_annotations(ticket_id: int, db: Session = Depends(get_db)):
    t = TicketService.get_by_id(db, ticket_id)
    if not t:
        raise HTTPException(status_code=404, detail="工单不存在")
    return AnnotationService.get_versions(db, ticket_id)


@annotations_router.post("", response_model=AnnotationResponse, status_code=201)
def create_annotation(data: AnnotationCreate, db: Session = Depends(get_db)):
    annotation, err = AnnotationService.create_annotation(db, data)
    if err:
        raise HTTPException(status_code=400, detail=err)
    return annotation


@annotations_router.post("/batch-confirm", response_model=BatchConfirmResponse)
def batch_confirm(data: BatchConfirmRequest, db: Session = Depends(get_db)):
    result, err = AnnotationService.batch_confirm(db, data)
    if err:
        raise HTTPException(status_code=400, detail=err)
    StatsService.mark_stats_updated(db, result["batch_id"])
    return BatchConfirmResponse(**result)


error_router = APIRouter(prefix="/error-samples", tags=["错误样本"])


@error_router.get("", response_model=ErrorSampleListResponse)
def list_error_samples(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    source: Optional[str] = None,
    included_in_training: Optional[bool] = None,
    model_version_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    items, total, by_source = ErrorSampleService.list(
        db, page, page_size, source=source,
        included_in_training=included_in_training,
        model_version_id=model_version_id,
    )
    resp_items = []
    for e in items:
        resp_items.append(ErrorSampleResponse(
            id=e.id,
            ticket_id=e.ticket_id,
            original_predicted_id=e.original_predicted_id,
            correct_category_id=e.correct_category_id,
            source=e.source,
            error_type=e.error_type,
            model_version_id=e.model_version_id,
            included_in_training=e.included_in_training,
            training_run_id=e.training_run_id,
            created_at=e.created_at,
            reported_by=e.reported_by,
            ticket_title=e.ticket.title if e.ticket else None,
        ))
    return ErrorSampleListResponse(
        items=resp_items, total=total, page=page, page_size=page_size,
        by_source=by_source,
    )


@error_router.get("/sources")
def get_error_sources(db: Session = Depends(get_db)):
    return ErrorSampleService.get_error_sources_with_metadata(db)
