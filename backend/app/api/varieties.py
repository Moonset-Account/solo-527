from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from .. import models, schemas

router = APIRouter(prefix="/varieties", tags=["品种管理"])


@router.get("", response_model=List[schemas.Variety])
def get_varieties(
    category: Optional[str] = None,
    keyword: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(models.Variety)
    if category:
        query = query.filter(models.Variety.category == category)
    if keyword:
        query = query.filter(
            models.Variety.name.contains(keyword) | models.Variety.code.contains(keyword)
        )
    return query.order_by(models.Variety.id.desc()).offset(skip).limit(limit).all()


@router.get("/{variety_id}", response_model=schemas.Variety)
def get_variety(variety_id: int, db: Session = Depends(get_db)):
    variety = db.query(models.Variety).filter(models.Variety.id == variety_id).first()
    if not variety:
        raise HTTPException(status_code=404, detail="品种不存在")
    return variety


@router.post("", response_model=schemas.Variety)
def create_variety(variety: schemas.VarietyCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Variety).filter(models.Variety.code == variety.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="品种编号已存在")
    db_variety = models.Variety(**variety.model_dump())
    db.add(db_variety)
    db.commit()
    db.refresh(db_variety)
    return db_variety


@router.put("/{variety_id}", response_model=schemas.Variety)
def update_variety(
    variety_id: int, variety_update: schemas.VarietyUpdate, db: Session = Depends(get_db)
):
    variety = db.query(models.Variety).filter(models.Variety.id == variety_id).first()
    if not variety:
        raise HTTPException(status_code=404, detail="品种不存在")
    update_data = variety_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(variety, key, value)
    db.commit()
    db.refresh(variety)
    return variety


@router.delete("/{variety_id}")
def delete_variety(variety_id: int, db: Session = Depends(get_db)):
    variety = db.query(models.Variety).filter(models.Variety.id == variety_id).first()
    if not variety:
        raise HTTPException(status_code=404, detail="品种不存在")
    db.delete(variety)
    db.commit()
    return {"message": "删除成功"}
