from celery import Celery

from app.config import settings

celery_app = Celery(
    "grid_event",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    beat_schedule={
        "timeout-check-every-30-min": {
            "task": "app.tasks.timeout_check.check_timeout",
            "schedule": 1800,
        },
    },
)

celery_app.autodiscover_tasks(["app.tasks"])
