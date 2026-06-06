from django.contrib import admin
from .models import Notification, ScheduleConflict, DailySchedule


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'type', 'title', 'is_read', 'created_at']
    list_filter = ['type', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'user__username']
    readonly_fields = ['created_at', 'read_at']


@admin.register(ScheduleConflict)
class ScheduleConflictAdmin(admin.ModelAdmin):
    list_display = [
        'type', 'severity', 'exhibition', 'conflict_date',
        'is_resolved', 'created_at'
    ]
    list_filter = ['type', 'severity', 'is_resolved', 'conflict_date']
    search_fields = ['description', 'exhibition__name']
    readonly_fields = ['created_at', 'resolved_at']


@admin.register(DailySchedule)
class DailyScheduleAdmin(admin.ModelAdmin):
    list_display = ['date', 'created_at', 'updated_at']
    search_fields = ['date', 'notes']
    readonly_fields = ['created_at', 'updated_at']
