from django.contrib import admin
from .models import Alert, AlertRecord, AlertAttachment, AlertHistory


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ('code', 'title', 'level', 'status', 'server', 'occurred_at', 'organization')
    list_filter = ('level', 'status', 'source', 'organization')
    search_fields = ('code', 'title', 'content')


@admin.register(AlertRecord)
class AlertRecordAdmin(admin.ModelAdmin):
    list_display = ('alert', 'action', 'processed_by', 'processed_at')
    list_filter = ('action',)
    search_fields = ('alert__code', 'comment')


@admin.register(AlertAttachment)
class AlertAttachmentAdmin(admin.ModelAdmin):
    list_display = ('alert', 'file_name', 'file_size', 'created_at')
    search_fields = ('file_name', 'alert__code')


@admin.register(AlertHistory)
class AlertHistoryAdmin(admin.ModelAdmin):
    list_display = ('alert', 'field', 'changed_by', 'changed_at')
    search_fields = ('alert__code', 'field')
