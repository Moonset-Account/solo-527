from django.conf import settings
from django.db import models


class Reminder(models.Model):
    class Priority(models.TextChoices):
        HIGH = 'high', 'High'
        MEDIUM = 'medium', 'Medium'
        LOW = 'low', 'Low'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        HANDLED = 'handled', 'Handled'
        ESCALATED = 'escalated', 'Escalated'

    reconciliation = models.ForeignKey('reconciliations.Reconciliation', on_delete=models.CASCADE, related_name='reminders')
    assignee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reminders')
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    due_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    handled_at = models.DateTimeField(null=True, blank=True)
    escalation_level = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Reminder for {self.reconciliation.project_name} - {self.get_priority_display()} priority'


class ReminderConfig(models.Model):
    first_reminder_days = models.PositiveIntegerField(default=3)
    repeat_interval_days = models.PositiveIntegerField(default=1)
    escalation_timeout_hours = models.PositiveIntegerField(default=24)
    max_escalation_level = models.PositiveIntegerField(default=3)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='updated_reminder_configs')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f'ReminderConfig (first: {self.first_reminder_days}d, repeat: {self.repeat_interval_days}d)'
