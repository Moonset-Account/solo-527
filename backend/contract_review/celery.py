import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'contract_review.settings')

app = Celery('contract_review')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
