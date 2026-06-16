from django.contrib import admin
from .models import Notification, UserNotification, Announcement
from import_export.admin import ImportExportModelAdmin


@admin.register(Notification)
class NotificationAdmin(ImportExportModelAdmin):
    list_display = ['title', 'type', 'sender', 'is_published', 'created_at']
    list_filter = ['type', 'is_published', 'created_at']
    search_fields = ['title', 'content']


@admin.register(UserNotification)
class UserNotificationAdmin(admin.ModelAdmin):
    list_display = ['notification', 'user', 'is_read', 'read_at']
    list_filter = ['is_read']
    date_hierarchy = 'notification__created_at'


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'is_top', 'is_published', 'published_at', 'expires_at']
    list_filter = ['is_top', 'is_published', 'published_at']
    search_fields = ['title', 'content']
