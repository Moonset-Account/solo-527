import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'museum_scheduler.settings')

app = Celery('museum_scheduler')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
