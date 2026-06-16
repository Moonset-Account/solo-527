from celery import Celery
from .config import settings

celery_app = Celery(
    "procurement_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=False,
    task_track_started=True,
    task_time_limit=30 * 60,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

celery_app.conf.beat_schedule = {
    "check-delivery-alerts-every-hour": {
        "task": "app.tasks.check_delivery_alerts",
        "schedule": 3600,
    },
    "check-quote-expiry-daily": {
        "task": "app.tasks.check_quote_expiry",
        "schedule": 86400,
    },
    "check-agreement-expiry-daily": {
        "task": "app.tasks.check_agreement_expiry",
        "schedule": 86400,
    },
    "sync-dashboard-daily": {
        "task": "app.tasks.sync_dashboard_data",
        "schedule": 86400,
    },
}
