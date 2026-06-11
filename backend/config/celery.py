import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('cs_ai_workbench')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks(['celery_tasks'])

app.conf.beat_schedule = {
    'calculate-daily-stats-every-midnight': {
        'task': 'celery_tasks.tasks.calculate_daily_stats',
        'schedule': crontab(hour=0, minute=0),
    },
    'update-accuracy-stats-every-hour': {
        'task': 'celery_tasks.tasks.update_accuracy_stats',
        'schedule': crontab(minute=0),
    },
    'cleanup-old-conversations-every-day': {
        'task': 'celery_tasks.tasks.cleanup_old_conversations',
        'schedule': crontab(hour=3, minute=0),
    },
}

app.conf.timezone = 'Asia/Shanghai'
app.conf.enable_utc = False


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
