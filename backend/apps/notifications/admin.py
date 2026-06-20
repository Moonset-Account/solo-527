from django.contrib import admin
from .models import NotificationRule, Notification


@admin.register(NotificationRule)
class NotificationRuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'trigger', 'method', 'is_active', 'organization')
    list_filter = ('trigger', 'method', 'is_active', 'organization')
    search_fields = ('name', 'description')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'title', 'notification_type', 'status', 'created_at')
    list_filter = ('notification_type', 'status', 'organization')
    search_fields = ('title', 'content')
