import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationOut, NotificationCreate
from app.services.notification import (
    create_notification,
    process_notification,
    retry_pending_notifications,
)

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/", response_model=list[NotificationOut])
def list_notifications(
    status: str | None = None,
    notify_type: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Notification)
    if status:
        query = query.filter(Notification.status == status)
    if notify_type:
        query = query.filter(Notification.notify_type == notify_type)
    return query.order_by(Notification.created_at.desc()).all()


@router.post("/", response_model=NotificationOut)
def create(data: NotificationCreate, db: Session = Depends(get_db)):
    return create_notification(
        db,
        notify_type=data.notify_type,
        recipient_type=data.recipient_type,
        recipient_id=data.recipient_id,
        recipient_phone=data.recipient_phone,
        content=data.content,
        related_id=data.related_id,
        related_type=data.related_type,
    )


@router.post("/{notification_id}/send", response_model=NotificationOut)
def send(notification_id: uuid.UUID, db: Session = Depends(get_db)):
    try:
        return process_notification(db, notification_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/retry-pending", response_model=list[NotificationOut])
def retry_pending(db: Session = Depends(get_db)):
    return retry_pending_notifications(db)
