from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.security import get_current_user, require_roles

router = APIRouter(prefix="/reminders", tags=["近效期提醒"])


@router.get("", response_model=dict)
async def list_reminders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    level: Optional[str] = None,
    batch_no: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.ExpiryReminder).options(
        joinedload(models.ExpiryReminder.batch).joinedload(models.Batch.medicine),
        joinedload(models.ExpiryReminder.handler)
    )
    if status:
        query = query.filter(models.ExpiryReminder.status == status)
    if level:
        query = query.filter(models.ExpiryReminder.reminder_level == level)
    if batch_no:
        query = query.join(models.Batch).filter(models.Batch.batch_no.like(f"%{batch_no}%"))
    total = query.count()
    items = query.order_by(models.ExpiryReminder.days_to_expiry.asc()).offset(
        (page - 1) * page_size
    ).limit(page_size).all()
    return {
        "items": [schemas.ExpiryReminderResponse.model_validate(i) for i in items],
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("/{reminder_id}/handle", response_model=schemas.ExpiryReminderResponse)
async def handle_reminder(
    reminder_id: int,
    data: schemas.ExpiryReminderHandle,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("admin", "purchaser", "warehouse", "manager"))
):
    reminder = db.query(models.ExpiryReminder).filter(
        models.ExpiryReminder.id == reminder_id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="提醒不存在")
    duration = None
    if reminder.created_at:
        duration = int((datetime.utcnow() - reminder.created_at.replace(tzinfo=None)).total_seconds() / 60)
    reminder.status = data.status
    reminder.handle_remark = data.handle_remark
    reminder.handled_by = current_user.id
    reminder.handled_at = datetime.utcnow()
    reminder.handle_duration_minutes = duration
    db.commit()
    db.refresh(reminder)
    return reminder


@router.get("/stats", response_model=dict)
async def reminder_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    pending = db.query(models.ExpiryReminder).filter(
        models.ExpiryReminder.status == models.ReminderStatus.PENDING
    ).count()
    critical = db.query(models.ExpiryReminder).filter(
        models.ExpiryReminder.status == models.ReminderStatus.PENDING,
        models.ExpiryReminder.reminder_level == models.RiskLevel.CRITICAL
    ).count()
    high = db.query(models.ExpiryReminder).filter(
        models.ExpiryReminder.status == models.ReminderStatus.PENDING,
        models.ExpiryReminder.reminder_level == models.RiskLevel.HIGH
    ).count()
    medium = db.query(models.ExpiryReminder).filter(
        models.ExpiryReminder.status == models.ReminderStatus.PENDING,
        models.ExpiryReminder.reminder_level == models.RiskLevel.MEDIUM
    ).count()
    return {
        "pending": pending,
        "critical": critical,
        "high": high,
        "medium": medium
    }
