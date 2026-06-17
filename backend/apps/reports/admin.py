from django.contrib import admin
from .models import ReportTemplate, ReportSchedule, ReportInstance, DashboardWidget


@admin.register(ReportTemplate)
class ReportTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'report_type', 'status', 'created_by', 'created_at']
    list_filter = ['report_type', 'status', 'created_at']
    search_fields = ['name', 'description']


@admin.register(ReportSchedule)
class ReportScheduleAdmin(admin.ModelAdmin):
    list_display = ['name', 'template', 'frequency', 'status', 'run_time', 'last_run_at']
    list_filter = ['frequency', 'status', 'last_run_at']
    search_fields = ['name', 'template__name']


@admin.register(ReportInstance)
class ReportInstanceAdmin(admin.ModelAdmin):
    list_display = ['name', 'report_type', 'status', 'period_start', 'period_end',
                    'created_by', 'created_at']
    list_filter = ['report_type', 'status', 'created_at', 'period_start', 'period_end']
    search_fields = ['name', 'error_message']
    date_hierarchy = 'created_at'


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ['name', 'widget_type', 'size', 'data_source', 'position', 'is_active']
    list_filter = ['widget_type', 'size', 'is_active']
    search_fields = ['name', 'data_source']
