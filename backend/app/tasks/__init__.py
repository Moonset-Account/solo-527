from app.celery_app import celery_app
from app.core.database import SessionLocal
from app.models import ChangeRequest, RequestStatus, ApprovalStage
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


@celery_app.task(name="send_request_notification")
def send_request_notification(request_id: int, action: str):
    db = SessionLocal()
    try:
        req = db.query(ChangeRequest).filter(ChangeRequest.id == request_id).first()
        if req:
            logger.info(f"通知: 申请[{req.title}] {action}")
        return {"status": "success", "request_id": request_id, "action": action}
    finally:
        db.close()


@celery_app.task(name="check_change_window_deadline")
def check_change_window_deadline():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        upcoming = db.query(ChangeRequest).filter(
            ChangeRequest.status == RequestStatus.IN_PROGRESS,
            ChangeRequest.current_stage == ApprovalStage.IMPLEMENTATION,
            ChangeRequest.change_window_end > now,
            ChangeRequest.change_window_end < now + timedelta(hours=24)
        ).all()

        for req in upcoming:
            logger.info(f"提醒: 申请[{req.title}]变更窗口即将结束")

        return {"checked": len(upcoming)}
    finally:
        db.close()


@celery_app.task(name="cleanup_old_error_logs")
def cleanup_old_error_logs(days: int = 90):
    from app.models import ApiErrorLog
    db = SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(days=days)
        old_logs = db.query(ApiErrorLog).filter(
            ApiErrorLog.created_at < cutoff,
            ApiErrorLog.resolved == True
        ).delete()
        db.commit()
        return {"deleted": old_logs}
    finally:
        db.close()
