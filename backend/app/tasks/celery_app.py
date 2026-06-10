from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "qinghe_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
)

import app.tasks.notification_tasks
import app.tasks.scheduled_tasks
