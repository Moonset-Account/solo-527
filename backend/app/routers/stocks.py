from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import Optional
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/stocks", tags=["库存"])


@router.get("", response_model=dict)
async def list_stocks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    medicine_id: Optional[int] = None,
    location_id: Optional[int] = None,
    batch_id: Optional[int] = None,
    only_positive: Optional[bool] = True,
    low_stock_only: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Stock).options(
        joinedload(models.Stock.batch).joinedload(models.Batch.medicine),
        joinedload(models.Stock.location)
    )
    if keyword:
        query = query.join(models.Batch).join(models.Medicine).filter(
            or_(
                models.Batch.batch_no.like(f"%{keyword}%"),
                models.Medicine.name.like(f"%{keyword}%"),
                models.Medicine.code.like(f"%{keyword}%")
            )
        )
    if medicine_id:
        query = query.join(models.Batch).filter(models.Batch.medicine_id == medicine_id)
    if location_id:
        query = query.filter(models.Stock.location_id == location_id)
    if batch_id:
        query = query.filter(models.Stock.batch_id == batch_id)
    if only_positive:
        query = query.filter(models.Stock.quantity > 0)
    total = query.count()
    items = query.order_by(models.Stock.updated_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    return {
        "items": [schemas.StockResponse.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get("/summary", response_model=dict)
async def stock_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    total_stock = db.query(func.sum(models.Stock.quantity)).scalar() or 0
    total_value = db.query(func.sum(models.Stock.quantity * models.Batch.purchase_price)).join(
        models.Batch, models.Stock.batch_id == models.Batch.id
    ).scalar() or 0
    total_skus = db.query(func.count(func.distinct(models.Batch.medicine_id))).join(
        models.Stock, models.Stock.batch_id == models.Batch.id
    ).scalar() or 0
    low_stock_count = db.query(models.Medicine).join(
        models.Batch, models.Batch.medicine_id == models.Medicine.id
    ).join(
        models.Stock, models.Stock.batch_id == models.Batch.id
    ).group_by(models.Medicine.id).having(
        func.sum(models.Stock.available_quantity) < models.Medicine.safety_stock
    ).count()
    return {
        "total_stock": total_stock,
        "total_value": float(total_value),
        "total_skus": total_skus,
        "low_stock_count": low_stock_count
    }


@router.get("/by-medicine/{medicine_id}", response_model=dict)
async def get_stock_by_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    stocks = db.query(models.Stock).options(
        joinedload(models.Stock.batch),
        joinedload(models.Stock.location)
    ).join(models.Batch).filter(
        models.Batch.medicine_id == medicine_id,
        models.Stock.quantity > 0
    ).all()
    total_qty = sum(s.quantity for s in stocks)
    total_available = sum(s.available_quantity for s in stocks)
    return {
        "items": [schemas.StockResponse.model_validate(s) for s in stocks],
        "total_quantity": total_qty,
        "total_available": total_available
    }


@router.post("/flow", response_model=schemas.BatchFlowResponse)
async def create_flow(
    data: schemas.BatchFlowCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "warehouse", "manager"))
):
    flow = models.BatchFlow(**data.model_dump(), operator_id=current_user.id)
    db.add(flow)

    batch = db.query(models.Batch).filter(models.Batch.id == data.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")

    flow_type = data.flow_type
    qty = data.quantity

    if data.from_location_id:
        from_stock = db.query(models.Stock).filter(
            models.Stock.batch_id == data.batch_id,
            models.Stock.location_id == data.from_location_id
        ).first()
        if not from_stock or from_stock.available_quantity < qty:
            raise HTTPException(status_code=400, detail="源库位库存不足")
        from_stock.quantity -= qty
        from_stock.available_quantity -= qty
        from_stock.last_move_date = data.operation_time.date() if data.operation_time else None

    if data.to_location_id:
        to_stock = db.query(models.Stock).filter(
            models.Stock.batch_id == data.batch_id,
            models.Stock.location_id == data.to_location_id
        ).first()
        if not to_stock:
            to_stock = models.Stock(
                batch_id=data.batch_id,
                location_id=data.to_location_id,
                quantity=0,
                available_quantity=0
            )
            db.add(to_stock)
        to_stock.quantity += qty
        to_stock.available_quantity += qty
        to_stock.last_move_date = data.operation_time.date() if data.operation_time else None

    db.commit()
    db.refresh(flow)
    return flow


@router.get("/flows", response_model=dict)
async def list_flows(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    batch_id: Optional[int] = None,
    flow_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    keyword: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.BatchFlow).options(
        joinedload(models.BatchFlow.batch).joinedload(models.Batch.medicine),
        joinedload(models.BatchFlow.operator),
        joinedload(models.BatchFlow.from_location),
        joinedload(models.BatchFlow.to_location)
    )
    if batch_id:
        query = query.filter(models.BatchFlow.batch_id == batch_id)
    if flow_type:
        query = query.filter(models.BatchFlow.flow_type == flow_type)
    if keyword:
        query = query.join(models.Batch).join(models.Medicine).filter(
            or_(
                models.Batch.batch_no.like(f"%{keyword}%"),
                models.Medicine.name.like(f"%{keyword}%"),
                models.BatchFlow.counterparty.like(f"%{keyword}%")
            )
        )
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
