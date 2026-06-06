from celery import Celery
from celery.schedules import crontab
from app.core.config import settings
from app.core.database import SessionLocal
from app.services.task_service import TaskService
from app.core.logging import logger

celery = Celery(
    "homestay_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
)

celery.conf.beat_schedule = {
    "check-overdue-tasks-every-30-minutes": {
        "task": "app.worker.check_overdue_tasks",
        "schedule": crontab(minute="*/30"),
    },
}


@celery.task(name="app.worker.check_overdue_tasks")
def check_overdue_tasks():
    logger.info("Running scheduled overdue task check")
    db = SessionLocal()
    try:
        result = TaskService.check_and_update_overdue(db)
        logger.info(f"Overdue check result: {result}")
        return result
    except Exception as e:
        logger.error(f"Error checking overdue tasks: {e}")
        raise
    finally:
        db.close()


@celery.task(name="app.worker.send_notification")
def send_notification(user_id: int, title: str, content: str):
    logger.info(f"Sending notification to user {user_id}: {title}")
    from app.models import Notification
    db = SessionLocal()
    try:
        notification = Notification(
            user_id=user_id,
            title=title,
            content=content,
            notification_type="system"
        )
        db.add(notification)
        db.commit()
        return True
    except Exception as e:
        logger.error(f"Error sending notification: {e}")
        raise
    finally:
        db.close()
