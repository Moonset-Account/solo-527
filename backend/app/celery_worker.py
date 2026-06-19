from celery import Celery
from app.config import settings

celery = Celery(
    "pharm_trace",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    task_track_started=True,
    result_expires=3600,
)

celery.conf.beat_schedule = {
    "check-near-expiry-every-day": {
        "task": "app.tasks.check_near_expiry_batches",
        "schedule": 86400,
    },
    "check-low-stock-every-6-hours": {
        "task": "app.tasks.check_low_stock",
        "schedule": 21600,
    },
    "generate-replenish-suggestions-every-day": {
        "task": "app.tasks.generate_replenish_suggestions",
        "schedule": 86400,
    },
    "check-sign-differences-every-day": {
        "task": "app.tasks.check_sign_differences",
        "schedule": 86400,
    },
}

from app import tasks
