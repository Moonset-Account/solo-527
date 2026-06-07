from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from app.database import get_db
from app.models import SafetyEvent, NotificationLog, NotificationStatus, User
from app.auth import require_project_manager
from app.routers.events import event_to_schema
from app.schemas import Event as EventSchema

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.post("/{event_id}/resend", response_model=EventSchema)
def resend_notification(
    event_id: UUID,
    current_user: User = Depends(require_project_manager),
    db: Session = Depends(get_db)
):
    event = db.query(SafetyEvent).filter(SafetyEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.notification_attempts += 1
    
    import random
    success = random.random() > 0.2
    
    if success:
        event.notification_status = NotificationStatus.SUCCESS
        log_status = NotificationStatus.SUCCESS
        error_msg = None
    else:
        event.notification_status = NotificationStatus.FAILED
        log_status = NotificationStatus.FAILED
        error_msg = "家长通知发送失败，请稍后重试"
    
    log = NotificationLog(
        event_id=event.id,
        status=log_status,
        error_message=error_msg,
        sent_at=datetime.utcnow()
    )
    db.add(log)
    
    db.commit()
    db.refresh(event)
    
    return event_to_schema(event)
