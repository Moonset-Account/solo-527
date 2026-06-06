from django.contrib import admin
from .models import ImportTask, ReportTask

@admin.register(ImportTask)
class ImportTaskAdmin(admin.ModelAdmin):
    list_display = ['task_id', 'data_type', 'user', 'status', 'total_rows', 'success_rows', 'failed_rows', 'created_at']
    list_filter = ['status', 'data_type']
    search_fields = ['task_id', 'user__username']

@admin.register(ReportTask)
class ReportTaskAdmin(admin.ModelAdmin):
    list_display = ['task_id', 'report_type', 'user', 'status', 'exclude_trial', 'created_at']
    list_filter = ['status', 'report_type', 'exclude_trial']
    search_fields = ['task_id', 'user__username']
