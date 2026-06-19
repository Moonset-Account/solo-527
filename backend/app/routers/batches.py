from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, and_
from typing import Optional, List
from datetime import date, datetime, timedelta
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/batches", tags=["批次"])


@router.get("", response_model=dict)
async def list_batches(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    medicine_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    status: Optional[str] = None,
    location_id: Optional[int] = None,
    near_expiry_only: Optional[bool] = None,
    expiry_from: Optional[date] = None,
    expiry_to: Optional[date] = None,
    sign_diff_only: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Batch).options(
        joinedload(models.Batch.medicine),
        joinedload(models.Batch.creator)
    )
    if keyword:
        query = query.join(models.Medicine).filter(
            or_(
                models.Batch.batch_no.like(f"%{keyword}%"),
                models.Medicine.name.like(f"%{keyword}%"),
                models.Medicine.code.like(f"%{keyword}%")
            )
        )
    if medicine_id:
        query = query.filter(models.Batch.medicine_id == medicine_id)
    if supplier_id:
        query = query.filter(models.Batch.supplier_id == supplier_id)
    if status:
        query = query.filter(models.Batch.status == status)
    if location_id:
        query = query.filter(models.Batch.location_id == location_id)
    if near_expiry_only:
        threshold = date.today() + timedelta(days=180)
        query = query.filter(models.Batch.expiry_date <= threshold)
    if expiry_from:
        query = query.filter(models.Batch.expiry_date >= expiry_from)
    if expiry_to:
        query = query.filter(models.Batch.expiry_date <= expiry_to)
    if sign_diff_only:
        query = query.filter(models.Batch.sign_difference != 0)
    total = query.count()
    items = query.order_by(models.Batch.expiry_date.asc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    return {
        "items": [schemas.BatchResponse.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("", response_model=schemas.BatchResponse)
async def create_batch(
    data: schemas.BatchCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "purchaser", "warehouse"))
):
    batch = models.Batch(**data.model_dump(), created_by=current_user.id)
    batch.received_quantity = data.quantity
    db.add(batch)
    db.flush()

    if data.location_id:
        stock = models.Stock(
            batch_id=batch.id,
            location_id=data.location_id,
            quantity=data.quantity,
            available_quantity=data.quantity,
            last_move_date=date.today()
        )
        db.add(stock)

    db.commit()
    db.refresh(batch)
    return batch


@router.get("/{batch_id}", response_model=schemas.BatchResponse)
async def get_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    batch = db.query(models.Batch).options(
        joinedload(models.Batch.medicine).joinedload(models.Medicine.supplier),
        joinedload(models.Batch.creator),
        joinedload(models.Batch.stocks).joinedload(models.Stock.location)
    ).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    return batch


@router.put("/{batch_id}", response_model=schemas.BatchResponse)
async def update_batch(
    batch_id: int,
    data: schemas.BatchUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "purchaser", "warehouse", "manager"))
):
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(batch, k, v)
    db.commit()
    db.refresh(batch)
    return batch


@router.get("/{batch_id}/flows", response_model=dict)
async def get_batch_flows(
    batch_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    query = db.query(models.BatchFlow).filter(models.BatchFlow.batch_id == batch_id)
    total = query.count()
    items = query.order_by(models.BatchFlow.operation_time.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    return {
        "items": [schemas.BatchFlowResponse.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get("/trace/{batch_no}", response_model=dict)
async def trace_batch(
    batch_no: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    batches = db.query(models.Batch).filter(
        models.Batch.batch_no == batch_no
    ).options(
        joinedload(models.Batch.medicine),
        joinedload(models.Batch.stocks).joinedload(models.Stock.location),
        joinedload(models.Batch.flows).joinedload(models.BatchFlow.from_location),
        joinedload(models.Batch.flows).joinedload(models.BatchFlow.to_location),
        joinedload(models.Batch.flows).joinedload(models.BatchFlow.operator)
    ).all()
    if not batches:
        raise HTTPException(status_code=404, detail="未找到该批号")
    return {
        "batches": [schemas.BatchResponse.model_validate(b) for b in batches],
        "total_flows": sum(len(b.flows) for b in batches)
    }
