from django.contrib import admin
from .models import QualityCheck, ImprovementAction, ExportRecord


@admin.register(QualityCheck)
class QualityCheckAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'status', 'score', 'checker', 'checked_at', 'created_at']
    list_filter = ['status', 'created_at', 'checked_at']
    search_fields = ['ticket__title', 'ticket__ticket_no', 'comments',
                     'issues_found', 'suggestions']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'updated_at', 'checked_at']


@admin.register(ImprovementAction)
class ImprovementActionAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'priority', 'assignee',
                    'due_date', 'progress', 'created_at', 'is_overdue_display']
    list_filter = ['status', 'priority', 'due_date', 'created_at']
    search_fields = ['title', 'description', 'solution', 'result']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'updated_at', 'completed_at']

    def is_overdue_display(self, obj):
        from django.utils import timezone
        if obj.status in ['pending', 'in_progress'] and obj.due_date:
            return timezone.now().date() > obj.due_date
        return False
    is_overdue_display.short_description = '是否逾期'
    is_overdue_display.boolean = True


@admin.register(ExportRecord)
class ExportRecordAdmin(admin.ModelAdmin):
    list_display = ['export_type', 'file_name', 'status', 'filter_hash',
                    'record_count', 'created_by', 'created_at']
    list_filter = ['export_type', 'status', 'created_at', 'completed_at']
    search_fields = ['file_name', 'filter_hash', 'error_message']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'updated_at', 'started_at',
                       'completed_at', 'filter_hash', 'file_path', 'file_size']
