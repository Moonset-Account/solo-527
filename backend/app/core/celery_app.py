from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "art_exam_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.reminder_tasks", "app.tasks.report_tasks"],
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
    beat_schedule={
        "check-homework-daily": {
            "task": "app.tasks.reminder_tasks.check_homework_submission",
            "schedule": 60.0 * 30,
        },
        "check-overdue-reminders": {
            "task": "app.tasks.reminder_tasks.check_overdue_reminders",
            "schedule": 60.0 * 15,
        },
        "generate-daily-report": {
            "task": "app.tasks.report_tasks.generate_daily_report",
            "schedule": 60.0 * 60 * 24,
        },
    },
)
