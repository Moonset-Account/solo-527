from django.contrib import admin
from .models import Reminder, ReminderConfig


@admin.register(Reminder)
class ReminderAdmin(admin.ModelAdmin):
    list_display = ('reconciliation', 'assignee', 'priority', 'status', 'due_date', 'escalation_level')
    list_filter = ('status', 'priority')
    search_fields = ('reconciliation__project_name',)


@admin.register(ReminderConfig)
class ReminderConfigAdmin(admin.ModelAdmin):
    list_display = ('first_reminder_days', 'repeat_interval_days', 'escalation_timeout_hours', 'max_escalation_level', 'updated_at')
