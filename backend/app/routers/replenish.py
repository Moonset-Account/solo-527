from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/replenish", tags=["补货建议"])


@router.get("", response_model=dict)
async def list_suggestions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    medicine_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.ReplenishSuggestion).options(
        joinedload(models.ReplenishSuggestion.medicine).joinedload(models.Medicine.supplier),
        joinedload(models.ReplenishSuggestion.purchaser)
    )
    if status:
        query = query.filter(models.ReplenishSuggestion.status == status)
    if priority:
        query = query.filter(models.ReplenishSuggestion.priority == priority)
    if medicine_id:
        query = query.filter(models.ReplenishSuggestion.medicine_id == medicine_id)
    total = query.count()
    items = query.order_by(
        models.ReplenishSuggestion.priority.desc(),
        models.ReplenishSuggestion.created_at.desc()
    ).offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [schemas.ReplenishSuggestionResponse.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("/{suggestion_id}/assign", response_model=schemas.ReplenishSuggestionResponse)
async def assign_suggestion(
    suggestion_id: int,
    purchaser_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "manager"))
):
    suggestion = db.query(models.ReplenishSuggestion).filter(
        models.ReplenishSuggestion.id == suggestion_id
    ).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="补货建议不存在")
    purchaser = db.query(models.User).filter(models.User.id == purchaser_id).first()
    if not purchaser:
        raise HTTPException(status_code=404, detail="采购员不存在")
    suggestion.purchaser_id = purchaser_id
    suggestion.status = "assigned"
    db.commit()
    db.refresh(suggestion)
    return suggestion


@router.post("/{suggestion_id}/status", response_model=schemas.ReplenishSuggestionResponse)
async def update_suggestion_status(
    suggestion_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "purchaser", "manager"))
):
    suggestion = db.query(models.ReplenishSuggestion).filter(
        models.ReplenishSuggestion.id == suggestion_id
    ).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="补货建议不存在")
    valid_statuses = ["pending", "assigned", "in_progress", "ordered", "completed", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="无效状态")
    suggestion.status = new_status
    db.commit()
    db.refresh(suggestion)
    return suggestion
