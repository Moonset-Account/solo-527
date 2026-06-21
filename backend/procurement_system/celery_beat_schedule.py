from celery.schedules import crontab
from procurement_system.celery import app

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
