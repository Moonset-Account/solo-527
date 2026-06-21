import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'procurement_system.settings')

app = Celery('procurement_system')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'check-contract-expiry-daily': {
        'task': 'contracts.tasks.check_contract_expiry',
        'schedule': crontab(hour=9, minute=0),
    },
    'send-daily-digest': {
        'task': 'dashboard.tasks.send_daily_digest',
        'schedule': crontab(hour=8, minute=30),
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
