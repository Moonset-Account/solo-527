from celery import Celery
from app.config import settings

celery_app = Celery(
    "bakery_audit",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Shanghai",
    enable_utc=True,
    beat_schedule={
        "check-low-stock-every-hour": {
            "task": "app.tasks.check_low_stock",
            "schedule": 3600.0,
        },
        "daily-labor-cost-summary": {
            "task": "app.tasks.daily_labor_cost_summary",
            "schedule": 86400.0,
        },
    }
)

celery_app.autodiscover_tasks(["app"])
