from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'auto-check-no-show': {
        'task': 'apps.notifications.tasks.auto_check_no_show_reservations',
        'schedule': crontab(minute='*/30'),
    },
    'clean-expired-announcements': {
        'task': 'apps.notifications.tasks.clean_expired_announcements',
        'schedule': crontab(hour=1, minute=0),
    },
    'daily-repair-summary': {
        'task': 'apps.notifications.tasks.send_daily_repair_summary',
        'schedule': crontab(hour=8, minute=0),
    },
}
