from celery import Celery
from celery.schedules import crontab
from ..core.config import settings

celery_app = Celery(
    "qinghe_compliance",
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
    beat_schedule={
        "deadline-patrol-every-day-9am": {
            "task": "app.celery_tasks.tasks.deadline_patrol_task",
            "schedule": crontab(hour=9, minute=0),
        },
        "material-missing-check-every-6h": {
            "task": "app.celery_tasks.tasks.material_missing_check_task",
            "schedule": crontab(minute=0, hour="*/6"),
        },
    },
)

from . import tasks  # noqa: E402
