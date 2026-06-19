from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/abnormal", tags=["异常记录"])


@router.get("", response_model=dict)
async def list_abnormal(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    severity: Optional[str] = None,
    abnormal_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.AbnormalRecord).options(
        joinedload(models.AbnormalRecord.batch).joinedload(models.Batch.medicine),
        joinedload(models.AbnormalRecord.medicine),
        joinedload(models.AbnormalRecord.founder),
        joinedload(models.AbnormalRecord.handler)
    )
    if status:
        query = query.filter(models.AbnormalRecord.status == status)
    if severity:
        query = query.filter(models.AbnormalRecord.severity == severity)
    if abnormal_type:
        query = query.filter(models.AbnormalRecord.abnormal_type == abnormal_type)
    total = query.count()
    items = query.order_by(models.AbnormalRecord.created_at.desc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    return {
        "items": [schemas.AbnormalRecordResponse.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("", response_model=schemas.AbnormalRecordResponse)
async def create_abnormal(
    data: schemas.AbnormalRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "warehouse", "manager", "purchaser"))
):
    record = models.AbnormalRecord(
        **data.model_dump(),
        found_by=current_user.id
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/{record_id}/handle", response_model=schemas.AbnormalRecordResponse)
async def handle_abnormal(
    record_id: int,
    data: schemas.AbnormalRecordHandle,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "warehouse", "manager"))
):
    record = db.query(models.AbnormalRecord).filter(
        models.AbnormalRecord.id == record_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="异常记录不存在")
    duration = None
    if record.found_at:
        duration = int((datetime.utcnow() - record.found_at.replace(tzinfo=None)).total_seconds() / 60)
    record.status = data.status
    record.handle_solution = data.handle_solution
    record.handled_by = current_user.id
    record.handled_at = datetime.utcnow()
    record.handle_duration_minutes = duration
    db.commit()
    db.refresh(record)
    return record
