import uuid
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.config import settings
from app.models.notification import Notification


def create_notification(
    db: Session,
    notify_type: str,
    recipient_type: str,
    recipient_id: uuid.UUID,
    recipient_phone: str,
    content: str,
    related_id: uuid.UUID | None = None,
    related_type: str | None = None,
) -> Notification:
    notification = Notification(
        notify_type=notify_type,
        recipient_type=recipient_type,
        recipient_id=recipient_id,
        recipient_phone=recipient_phone,
        content=content,
        status="pending",
        retry_count=0,
        max_retries=settings.NOTIFICATION_MAX_RETRIES,
        related_id=related_id,
        related_type=related_type,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def process_notification(db: Session, notification_id: uuid.UUID) -> Notification:
    notification = (
        db.query(Notification).filter(Notification.id == notification_id).first()
    )
    if not notification:
        raise ValueError(f"Notification {notification_id} not found")

    success = _send_notification(notification)

    if success:
        notification.status = "sent"
        notification.sent_at = datetime.now()
    else:
        notification.retry_count += 1
        if notification.retry_count >= notification.max_retries:
            notification.status = "failed"
        else:
            notification.status = "retry"
            notification.next_retry_at = datetime.now() + timedelta(
                seconds=settings.NOTIFICATION_RETRY_INTERVAL_SECONDS
                * notification.retry_count
            )

    db.commit()
    db.refresh(notification)
    return notification


def retry_pending_notifications(db: Session) -> list[Notification]:
    now = datetime.now()
    pending = (
        db.query(Notification)
        .filter(
            Notification.status == "retry",
            Notification.next_retry_at <= now,
            Notification.retry_count < Notification.max_retries,
        )
        .all()
    )

    results = []
    for notification in pending:
        result = process_notification(db, notification.id)
        results.append(result)

    return results


def _send_notification(notification: Notification) -> bool:
    try:
        import httpx

        resp = httpx.post(
            "https://sms-api.example.com/send",
            json={
                "phone": notification.recipient_phone,
                "content": notification.content,
            },
            timeout=10,
        )
        return resp.status_code == 200
    except Exception:
        return False
