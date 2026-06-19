from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/sign-differences", tags=["签收差异"])


@router.get("", response_model=dict)
async def list_sign_differences(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    batch_no: Optional[str] = None,
    order_no: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.SignDifference).options(
        joinedload(models.SignDifference.batch).joinedload(models.Batch.medicine),
        joinedload(models.SignDifference.handler)
    )
    if status:
        query = query.filter(models.SignDifference.status == status)
    if batch_no:
        query = query.join(models.Batch).filter(models.Batch.batch_no.like(f"%{batch_no}%"))
    if order_no:
        query = query.filter(models.SignDifference.purchase_order_no.like(f"%{order_no}%"))
    total = query.count()
    items = query.order_by(models.SignDifference.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    return {
        "items": [schemas.SignDifferenceResponse.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("/{diff_id}/handle", response_model=schemas.SignDifferenceResponse)
async def handle_sign_difference(
    diff_id: int,
    data: schemas.SignDifferenceHandle,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "manager", "purchaser"))
):
    diff = db.query(models.SignDifference).filter(
        models.SignDifference.id == diff_id
    ).first()
    if not diff:
        raise HTTPException(status_code=404, detail="签收差异不存在")
    duration = int((datetime.utcnow() - diff.created_at.replace(tzinfo=None)).total_seconds() / 60)
    diff.status = data.status
    diff.difference_reason = data.difference_reason
    diff.handle_solution = data.handle_solution
    diff.handled_by = current_user.id
    diff.handled_at = datetime.utcnow()
    diff.handle_duration_minutes = duration

    batch = db.query(models.Batch).filter(models.Batch.id == diff.batch_id).first()
    if batch:
        batch.sign_difference_remark = data.difference_reason + "；" + data.handle_solution
    db.commit()
    db.refresh(diff)
    return diff
