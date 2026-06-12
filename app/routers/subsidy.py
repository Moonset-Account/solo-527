from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.security import get_current_user
from app.services import SubsidyBatchChainService, DataScopeService

router = APIRouter()


def _paginate(query, page: int, page_size: int):
    total = query.count()
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    pagination = schemas.Pagination(
        page=page,
        page_size=page_size,
        total=total,
        total_pages=total_pages,
    )
    return items, pagination


@router.get("/vouchers", response_model=schemas.PaginatedResponse[schemas.SubsidyVoucherOut])
def list_vouchers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    harvest_id: Optional[int] = Query(None),
    batch_id: Optional[int] = Query(None),
    variety_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    query = DataScopeService.filter_real_reports(
        db.query(models.SubsidyVoucher).order_by(models.SubsidyVoucher.id.desc())
    )
    if harvest_id is not None:
        query = query.filter(models.SubsidyVoucher.harvest_id == harvest_id)
    if batch_id is not None:
        query = query.filter(models.SubsidyVoucher.batch_id == batch_id)
    if variety_id is not None:
        query = query.filter(models.SubsidyVoucher.variety_id == variety_id)
    if status_filter is not None:
        query = query.filter(models.SubsidyVoucher.status == status_filter)
    items, pagination = _paginate(query, page, page_size)
    return schemas.PaginatedResponse(data=items, pagination=pagination)


@router.post("/vouchers", response_model=schemas.SubsidyVoucherOut, status_code=status.HTTP_201_CREATED)
def create_voucher(
    payload: schemas.SubsidyVoucherCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if db.query(models.SubsidyVoucher).filter(models.SubsidyVoucher.code == payload.code).first():
        raise HTTPException(status_code=400, detail=f"补贴凭证编码 {payload.code} 已存在")
    if not db.query(models.HarvestRecord).filter(models.HarvestRecord.id == payload.harvest_id).first():
        raise HTTPException(status_code=404, detail=f"采收记录 {payload.harvest_id} 不存在")
    if not db.query(models.Variety).filter(models.Variety.id == payload.variety_id).first():
        raise HTTPException(status_code=404, detail=f"品种 {payload.variety_id} 不存在")

    data = payload.model_dump()
    voucher = SubsidyBatchChainService.create_subsidy_voucher(db, data, current_user.id)
    db.commit()
    db.refresh(voucher)
    return voucher


@router.get("/vouchers/{voucher_id}", response_model=schemas.SubsidyVoucherOut)
def get_voucher(
    voucher_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    voucher = db.query(models.SubsidyVoucher).filter(models.SubsidyVoucher.id == voucher_id).first()
    if not voucher:
        raise HTTPException(status_code=404, detail="补贴凭证不存在")
    return voucher


@router.post("/vouchers/{voucher_id}/review", response_model=schemas.SubsidyVoucherOut)
def review_voucher(
    voucher_id: int,
    payload: schemas.SubsidyReview,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    voucher = SubsidyBatchChainService.review_subsidy(
        db=db,
        voucher_id=voucher_id,
        reviewer_id=payload.reviewer_id,
        status=payload.status,
        notes=payload.review_notes,
    )
    if not voucher:
        raise HTTPException(status_code=404, detail="补贴凭证不存在")
    db.commit()
    db.refresh(voucher)
    return voucher
