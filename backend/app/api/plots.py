from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/plots", tags=["地块管理"])


@router.get("", response_model=List[schemas.Plot])
def get_plots(
    status: Optional[str] = None,
    keyword: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(models.Plot)
    if status:
        query = query.filter(models.Plot.status == status)
    if keyword:
        query = query.filter(
            models.Plot.name.contains(keyword) | models.Plot.code.contains(keyword)
        )
    return query.order_by(models.Plot.id.desc()).offset(skip).limit(limit).all()


@router.get("/{plot_id}", response_model=schemas.Plot)
def get_plot(plot_id: int, db: Session = Depends(get_db)):
    plot = db.query(models.Plot).filter(models.Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="地块不存在")
    return plot


@router.post("", response_model=schemas.Plot)
def create_plot(plot: schemas.PlotCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Plot).filter(models.Plot.code == plot.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="地块编号已存在")
    db_plot = models.Plot(**plot.model_dump())
    db.add(db_plot)
    db.commit()
    db.refresh(db_plot)
    return db_plot


@router.put("/{plot_id}", response_model=schemas.Plot)
def update_plot(plot_id: int, plot_update: schemas.PlotUpdate, db: Session = Depends(get_db)):
    plot = db.query(models.Plot).filter(models.Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="地块不存在")
    update_data = plot_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(plot, key, value)
    db.commit()
    db.refresh(plot)
    return plot


@router.delete("/{plot_id}")
def delete_plot(plot_id: int, db: Session = Depends(get_db)):
    plot = db.query(models.Plot).filter(models.Plot.id == plot_id).first()
    if not plot:
        raise HTTPException(status_code=404, detail="地块不存在")
    db.delete(plot)
    db.commit()
    return {"message": "删除成功"}
