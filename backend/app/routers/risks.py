from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/risks", tags=["缺货风险"])


@router.get("", response_model=dict)
async def list_risks(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    level: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.StockRisk).options(
        joinedload(models.StockRisk.medicine).joinedload(models.Medicine.supplier),
        joinedload(models.StockRisk.creator)
    )
    if status:
        query = query.filter(models.StockRisk.status == status)
    if level:
        query = query.filter(models.StockRisk.risk_level == level)
    total = query.count()
    items = query.order_by(models.StockRisk.risk_level.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    return {
        "items": [schemas.StockRiskResponse.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("/{risk_id}/resolve", response_model=schemas.StockRiskResponse)
async def resolve_risk(
    risk_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "purchaser", "manager"))
):
    risk = db.query(models.StockRisk).filter(models.StockRisk.id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="风险不存在")
    risk.status = models.ReminderStatus.PROCESSED
    db.commit()
    db.refresh(risk)
    return risk
