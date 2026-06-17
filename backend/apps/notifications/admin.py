from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('type', 'level', 'title', 'created_at')
    list_filter = ('type', 'level', 'created_at')
    search_fields = ('title', 'message')
    date_hierarchy = 'created_at'
