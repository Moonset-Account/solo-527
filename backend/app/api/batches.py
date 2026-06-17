from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/batches", tags=["批次管理"])


@router.get("", response_model=List[schemas.BatchListItem])
def get_batches(
    status: Optional[str] = None,
    plot_id: Optional[int] = None,
    variety_id: Optional[int] = None,
    keyword: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = (
        db.query(
            models.Batch,
            models.Plot.name.label("plot_name"),
            models.Variety.name.label("variety_name"),
        )
        .join(models.Plot, models.Batch.plot_id == models.Plot.id)
        .join(models.Variety, models.Batch.variety_id == models.Variety.id)
    )
    if status:
        query = query.filter(models.Batch.status == status)
    if plot_id:
        query = query.filter(models.Batch.plot_id == plot_id)
    if variety_id:
        query = query.filter(models.Batch.variety_id == variety_id)
    if keyword:
        query = query.filter(
            models.Batch.batch_no.contains(keyword)
            | models.Plot.name.contains(keyword)
            | models.Variety.name.contains(keyword)
        )
    results = query.order_by(models.Batch.id.desc()).offset(skip).limit(limit).all()
    batches = []
    for batch, plot_name, variety_name in results:
        batch_dict = batch.__dict__.copy()
        batch_dict["plot_name"] = plot_name
        batch_dict["variety_name"] = variety_name
        batches.append(batch_dict)
    return batches


@router.get("/stats/yield", response_model=schemas.YieldStats)
def get_yield_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Batch).filter(models.Batch.status == "harvested")
    if start_date:
        query = query.filter(models.Batch.actual_harvest_date >= start_date)
    if end_date:
        query = query.filter(models.Batch.actual_harvest_date <= end_date)
    batches = query.all()

    total_predicted = sum(b.predicted_yield or 0 for b in batches)
    total_actual = sum(b.actual_yield or 0 for b in batches)

    by_variety = {}
    by_plot = {}
    by_month = {}

    for b in batches:
        vname = b.variety.name if b.variety else "未知"
        by_variety.setdefault(vname, 0)
        by_variety[vname] += b.actual_yield or 0

        pname = b.plot.name if b.plot else "未知"
        by_plot.setdefault(pname, 0)
        by_plot[pname] += b.actual_yield or 0

        if b.actual_harvest_date:
            month_key = b.actual_harvest_date.strftime("%Y-%m")
            by_month.setdefault(month_key, 0)
            by_month[month_key] += b.actual_yield or 0

    return {
        "total_predicted": total_predicted,
        "total_actual": total_actual,
        "by_variety": [{"name": k, "value": v} for k, v in by_variety.items()],
        "by_plot": [{"name": k, "value": v} for k, v in by_plot.items()],
        "by_month": [{"name": k, "value": v} for k, v in by_month.items()],
    }


@router.get("/{batch_id}", response_model=schemas.Batch)
def get_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    return batch


@router.post("", response_model=schemas.Batch)
def create_batch(batch: schemas.BatchCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Batch).filter(models.Batch.batch_no == batch.batch_no).first()
    if existing:
        raise HTTPException(status_code=400, detail="批次编号已存在")
    db_batch = models.Batch(**batch.model_dump())
    db.add(db_batch)
    db.commit()
    db.refresh(db_batch)
    return db_batch


@router.put("/{batch_id}", response_model=schemas.Batch)
def update_batch(
    batch_id: int, batch_update: schemas.BatchUpdate, db: Session = Depends(get_db)
):
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    update_data = batch_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(batch, key, value)
    db.commit()
    db.refresh(batch)
    return batch


@router.delete("/{batch_id}")
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(models.Batch).filter(models.Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="批次不存在")
    db.delete(batch)
    db.commit()
    return {"message": "删除成功"}
