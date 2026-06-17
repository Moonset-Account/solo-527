from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.reminder import Reminder, ReminderStatus, ReminderType, ReminderPriority
from app.schemas.dashboard import ReminderCreate, ReminderResponse, ReminderListResponse

router = APIRouter()


@router.get("", response_model=ReminderListResponse)
def list_reminders(
    user_id: Optional[int] = Query(None),
    student_id: Optional[int] = Query(None),
    type: Optional[ReminderType] = Query(None),
    status: Optional[ReminderStatus] = Query(None),
    is_overdue: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(Reminder)
    if user_id:
        query = query.filter(Reminder.user_id == user_id)
    if student_id:
        query = query.filter(Reminder.student_id == student_id)
    if type:
        query = query.filter(Reminder.type == type)
    if status:
        query = query.filter(Reminder.status == status)
    if is_overdue is not None:
        query = query.filter(Reminder.is_overdue == is_overdue)
    total = query.count()
    items = query.order_by(
        Reminder.is_overdue.desc(),
        Reminder.priority.asc(),
        Reminder.created_at.desc(),
    ).offset((page-1)*page_size).limit(page_size).all()
    return ReminderListResponse(total=total, items=items)


@router.post("", response_model=ReminderResponse)
def create_reminder(data: ReminderCreate, db: Session = Depends(get_db)):
    r = Reminder(**data.model_dump(), creator_id=1)
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.put("/{reminder_id}/read")
def mark_read(reminder_id: int, db: Session = Depends(get_db)):
    r = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not r:
        raise HTTPException(404, "提醒不存在")
    r.status = ReminderStatus.READ
    r.read_at = datetime.utcnow()
    db.commit()
    return {"message": "已标记已读", "read_at": str(r.read_at)}


@router.put("/{reminder_id}/dismiss")
def dismiss_reminder(reminder_id: int, db: Session = Depends(get_db)):
    r = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not r:
        raise HTTPException(404, "提醒不存在")
    r.status = ReminderStatus.DISMISSED
    r.dismissed_at = datetime.utcnow()
    db.commit()
    return {"message": "已忽略"}


@router.put("/batch-read")
def batch_mark_read(ids: List[int], db: Session = Depends(get_db)):
    now = datetime.utcnow()
    count = (
        db.query(Reminder)
        .filter(Reminder.id.in_(ids))
        .update({Reminder.status: ReminderStatus.READ, Reminder.read_at: now}, synchronize_session=False)
    )
    db.commit()
    return {"updated": count}
