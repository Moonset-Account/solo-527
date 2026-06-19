from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/strategies", tags=["提醒策略"])


@router.get("", response_model=dict)
async def list_strategies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    strategy_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "manager"))
):
    query = db.query(models.ReminderStrategy)
    if strategy_type:
        query = query.filter(models.ReminderStrategy.strategy_type == strategy_type)
    if is_active is not None:
        query = query.filter(models.ReminderStrategy.is_active == is_active)
    total = query.count()
    items = query.order_by(models.ReminderStrategy.priority.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    return {
        "items": [schemas.ReminderStrategyResponse.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("", response_model=schemas.ReminderStrategyResponse)
async def create_strategy(
    data: schemas.ReminderStrategyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin"))
):
    item = models.ReminderStrategy(**data.model_dump(), created_by=current_user.id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{strategy_id}", response_model=schemas.ReminderStrategyResponse)
async def update_strategy(
    strategy_id: int,
    data: schemas.ReminderStrategyUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin"))
):
    item = db.query(models.ReminderStrategy).filter(
        models.ReminderStrategy.id == strategy_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="策略不存在")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.post("/{strategy_id}/toggle")
async def toggle_strategy(
    strategy_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "manager"))
):
    item = db.query(models.ReminderStrategy).filter(
        models.ReminderStrategy.id == strategy_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="策略不存在")
    item.is_active = not item.is_active
    db.commit()
    return {"is_active": item.is_active, "effective_from": item.effective_from}
