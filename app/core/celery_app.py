from __future__ import annotations

from typing import Optional

from celery import Celery

from app.config import settings

_celery_app: Optional[Celery] = None


def get_celery_app() -> Celery:
    global _celery_app
    if _celery_app is not None:
        return _celery_app

    celery_app = Celery(
        "contract_ai",
        broker=settings.CELERY_BROKER_URL,
        backend=settings.CELERY_RESULT_BACKEND,
    )

    celery_app.conf.update(
        timezone="Asia/Shanghai",
        enable_utc=True,
        accept_content=["json", "pickle"],
        task_serializer="json",
        result_serializer="json",
        worker_concurrency=4,
        worker_prefetch_multiplier=1,
        task_acks_late=True,
        task_reject_on_worker_lost=True,
        task_track_started=True,
        task_time_limit=3600,
        task_soft_time_limit=3540,
        task_default_queue="default",
        task_routes={
            "ai.*": {"queue": "ai_queue"},
            "data.*": {"queue": "data_queue"},
            "eval.*": {"queue": "eval_queue"},
            "notify.*": {"queue": "notify_queue"},
        },
        task_queues={
            "default": {},
            "ai_queue": {},
            "data_queue": {},
            "eval_queue": {},
            "notify_queue": {},
        },
        imports=[
            "app.tasks.document_tasks",
            "app.tasks.ai_tasks",
            "app.tasks.eval_tasks",
            "app.tasks.notify_tasks",
        ],
        beat_schedule={},
    )

    _celery_app = celery_app
    return celery_app


celery_app = get_celery_app()
