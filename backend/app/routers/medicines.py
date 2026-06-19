from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import Optional
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/medicines", tags=["药品"])


@router.get("", response_model=dict)
async def list_medicines(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: Optional[str] = None,
    category: Optional[str] = None,
    supplier_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Medicine)
    if keyword:
        query = query.filter(
            or_(
                models.Medicine.name.like(f"%{keyword}%"),
                models.Medicine.code.like(f"%{keyword}%"),
                models.Medicine.generic_name.like(f"%{keyword}%"),
                models.Medicine.manufacturer.like(f"%{keyword}%")
            )
        )
    if category:
        query = query.filter(models.Medicine.category == category)
    if supplier_id:
        query = query.filter(models.Medicine.supplier_id == supplier_id)
    if is_active is not None:
        query = query.filter(models.Medicine.is_active == is_active)
    total = query.count()
    items = query.order_by(models.Medicine.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    return {
        "items": [schemas.MedicineResponse.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("", response_model=schemas.MedicineResponse)
async def create_medicine(
    data: schemas.MedicineCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "purchaser", "manager"))
):
    existing = db.query(models.Medicine).filter(
        or_(models.Medicine.code == data.code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="药品编码已存在")
    medicine = models.Medicine(**data.model_dump())
    db.add(medicine)
    db.commit()
    db.refresh(medicine)
    return medicine


@router.get("/{medicine_id}", response_model=schemas.MedicineResponse)
async def get_medicine(
    medicine_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="药品不存在")
    return medicine


@router.put("/{medicine_id}", response_model=schemas.MedicineResponse)
async def update_medicine(
    medicine_id: int,
    data: schemas.MedicineUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "manager", "purchaser"))
):
    medicine = db.query(models.Medicine).filter(models.Medicine.id == medicine_id).first()
    if not medicine:
        raise HTTPException(status_code=404, detail="药品不存在")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(medicine, k, v)
    db.commit()
    db.refresh(medicine)
    return medicine
