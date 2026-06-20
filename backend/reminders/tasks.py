from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from accounts.models import User
from reconciliations.models import Reconciliation
from .models import Reminder, ReminderConfig


@shared_task
def generate_reminders(reconciliation_id):
    try:
        reconciliation = Reconciliation.objects.get(pk=reconciliation_id)
    except Reconciliation.DoesNotExist:
        return

    config = ReminderConfig.objects.first()
    if not config:
        config = ReminderConfig.objects.create(
            first_reminder_days=3,
            repeat_interval_days=1,
            escalation_timeout_hours=24,
            max_escalation_level=3,
            updated_by_id=1,
        )

    project_managers = User.objects.filter(role=User.Role.PROJECT_MANAGER)

    due_date = timezone.now().date() + timedelta(days=config.first_reminder_days)

    for pm in project_managers:
        Reminder.objects.create(
            reconciliation=reconciliation,
            assignee=pm,
            priority=Reminder.Priority.HIGH,
            due_date=due_date,
        )


@shared_task
def check_escalations():
    config = ReminderConfig.objects.first()
    if not config:
        return

    today = timezone.now().date()

    overdue_reminders = Reminder.objects.filter(
        status='pending',
        due_date__lt=today,
    ).select_related('reconciliation', 'assignee')

    for reminder in overdue_reminders:
        new_level = reminder.escalation_level + 1

        reminder.escalation_level = new_level
        reminder.status = Reminder.Status.ESCALATED
        reminder.save()

        if new_level < config.max_escalation_level:
            admins = User.objects.filter(role=User.Role.ADMIN)
            due_date = today + timedelta(days=config.repeat_interval_days)

            for admin in admins:
                Reminder.objects.create(
                    reconciliation=reminder.reconciliation,
                    assignee=admin,
                    priority=Reminder.Priority.HIGH,
                    due_date=due_date,
                    escalation_level=new_level,
                )
