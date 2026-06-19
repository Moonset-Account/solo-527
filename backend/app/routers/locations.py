from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/locations", tags=["库位"])


@router.get("", response_model=dict)
async def list_locations(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    keyword: Optional[str] = None,
    zone: Optional[str] = None,
    temperature_zone: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.WarehouseLocation)
    if keyword:
        query = query.filter(
            or_(
                models.WarehouseLocation.code.like(f"%{keyword}%"),
                models.WarehouseLocation.name.like(f"%{keyword}%")
            )
        )
    if zone:
        query = query.filter(models.WarehouseLocation.zone == zone)
    if temperature_zone:
        query = query.filter(models.WarehouseLocation.temperature_zone == temperature_zone)
    total = query.count()
    items = query.order_by(models.WarehouseLocation.code).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    return {
        "items": [schemas.WarehouseLocationResponse.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("", response_model=schemas.WarehouseLocationResponse)
async def create_location(
    data: schemas.WarehouseLocationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "manager", "warehouse"))
):
    existing = db.query(models.WarehouseLocation).filter(
        models.WarehouseLocation.code == data.code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="库位编码已存在")
    loc = models.WarehouseLocation(**data.model_dump())
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc


@router.get("/{loc_id}", response_model=schemas.WarehouseLocationResponse)
async def get_location(
    loc_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    loc = db.query(models.WarehouseLocation).filter(models.WarehouseLocation.id == loc_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="库位不存在")
    return loc


@router.put("/{loc_id}", response_model=schemas.WarehouseLocationResponse)
async def update_location(
    loc_id: int,
    data: schemas.WarehouseLocationUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "manager", "warehouse"))
):
    loc = db.query(models.WarehouseLocation).filter(models.WarehouseLocation.id == loc_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="库位不存在")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(loc, k, v)
    db.commit()
    db.refresh(loc)
    return loc
