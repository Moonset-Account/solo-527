from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/sorting-orders", tags=["分拣订单"])


@router.get("", response_model=List[schemas.SortingOrderListItem])
def get_sorting_orders(
    status: Optional[str] = None,
    batch_id: Optional[int] = None,
    quality_level: Optional[str] = None,
    keyword: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = (
        db.query(
            models.SortingOrder,
            models.Batch.batch_no.label("batch_no"),
            models.Variety.name.label("variety_name"),
            models.Plot.name.label("plot_name"),
        )
        .join(models.Batch, models.SortingOrder.batch_id == models.Batch.id)
        .join(models.Variety, models.Batch.variety_id == models.Variety.id)
        .join(models.Plot, models.Batch.plot_id == models.Plot.id)
    )
    if status:
        query = query.filter(models.SortingOrder.status == status)
    if batch_id:
        query = query.filter(models.SortingOrder.batch_id == batch_id)
    if quality_level:
        query = query.filter(models.SortingOrder.quality_level == quality_level)
    if keyword:
        query = query.filter(
            models.SortingOrder.order_no.contains(keyword)
            | models.Batch.batch_no.contains(keyword)
            | models.Variety.name.contains(keyword)
        )
    results = query.order_by(models.SortingOrder.id.desc()).offset(skip).limit(limit).all()
    orders = []
    for order, batch_no, variety_name, plot_name in results:
        order_dict = order.__dict__.copy()
        order_dict["batch_no"] = batch_no
        order_dict["variety_name"] = variety_name
        order_dict["plot_name"] = plot_name
        orders.append(order_dict)
    return orders


@router.get("/{order_id}", response_model=schemas.SortingOrder)
def get_sorting_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.SortingOrder).filter(models.SortingOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="分拣订单不存在")
    return order


@router.post("", response_model=schemas.SortingOrder)
def create_sorting_order(order: schemas.SortingOrderCreate, db: Session = Depends(get_db)):
    existing = (
        db.query(models.SortingOrder).filter(models.SortingOrder.order_no == order.order_no).first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="订单编号已存在")
    db_order = models.SortingOrder(**order.model_dump())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


@router.put("/{order_id}", response_model=schemas.SortingOrder)
def update_sorting_order(
    order_id: int, order_update: schemas.SortingOrderUpdate, db: Session = Depends(get_db)
):
    order = db.query(models.SortingOrder).filter(models.SortingOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="分拣订单不存在")
    update_data = order_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(order, key, value)
    if order_update.status == "completed" and not order.completed_time:
        order.completed_time = datetime.now()
    db.commit()
    db.refresh(order)
    return order


@router.delete("/{order_id}")
def delete_sorting_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(models.SortingOrder).filter(models.SortingOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="分拣订单不存在")
    db.delete(order)
    db.commit()
    return {"message": "删除成功"}
