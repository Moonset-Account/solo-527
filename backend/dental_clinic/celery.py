import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dental_clinic.settings')

app = Celery('dental_clinic')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
