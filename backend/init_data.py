import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'reminder_project.settings')
django.setup()

from accounts.models import User
from reconciliations.models import Reconciliation, Difference
from reminders.models import Reminder, ReminderConfig
from configs.models import InvoiceConfig, PrepaidConfig, CashForecastConfig
from datetime import date, timedelta

if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123', role='admin')
if not User.objects.filter(username='pm1').exists():
    User.objects.create_user('pm1', 'pm1@example.com', 'pm123', role='project_manager')
if not User.objects.filter(username='finance1').exists():
    User.objects.create_user('finance1', 'finance1@example.com', 'fin123', role='finance')

admin = User.objects.get(username='admin')
pm1 = User.objects.get(username='pm1')

if not ReminderConfig.objects.exists():
    ReminderConfig.objects.create(
        first_reminder_days=3, repeat_interval_days=7,
        escalation_timeout_hours=48, max_escalation_level=3,
        updated_by=admin
    )

if not InvoiceConfig.objects.exists():
    InvoiceConfig.objects.create(approval_required=True, auto_apply_threshold=10000, updated_by=admin)

if not PrepaidConfig.objects.exists():
    PrepaidConfig.objects.create(balance_threshold=50000, warning_enabled=True, updated_by=admin)

if not CashForecastConfig.objects.exists():
    CashForecastConfig.objects.create(forecast_window_days=30, confidence_threshold=0.80, updated_by=admin)

projects = [
    ('智慧园区项目', '万科地产', 580000, 550000, 30000),
    ('ERP系统二期', '海尔集团', 1200000, 1150000, 50000),
    ('数据中台建设', '中国移动', 890000, 890000, 0),
    ('云迁移服务', '中国银行', 750000, 720000, 30000),
    ('物联网平台', '三一重工', 430000, 380000, 50000),
]

for name, client, total, matched, diff in projects:
    if not Reconciliation.objects.filter(project_name=name).exists():
        r = Reconciliation.objects.create(
            project_name=name, client_name=client, uploaded_by=admin,
            status='compared' if diff > 0 else 'confirmed',
            total_amount=total, matched_amount=matched, difference_amount=diff
        )
        if diff > 0:
            Difference.objects.create(
                reconciliation=r, item_type='amount',
                system_value=str(matched), uploaded_value=str(total),
                is_confirmed=None
            )

recs = list(Reconciliation.objects.filter(difference_amount__gt=0))
for rec in recs:
    if not Reminder.objects.filter(reconciliation=rec).exists():
        Reminder.objects.create(
            reconciliation=rec, assignee=pm1,
            priority='high' if rec.difference_amount >= 50000 else 'medium',
            status='pending', due_date=date.today() + timedelta(days=3),
            escalation_level=0
        )

print('Initial data created successfully')
