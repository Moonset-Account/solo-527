from rest_framework import serializers
from .models import ReportTemplate, ReportSchedule, ReportInstance, DashboardWidget
from apps.core.serializers import BaseSerializer


class ReportTemplateSerializer(BaseSerializer):
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ReportTemplate
        fields = [
            'id', 'name', 'report_type', 'report_type_display', 'status',
            'status_display', 'description', 'config', 'columns', 'filters',
            'chart_config', 'created_at', 'created_by_name', 'updated_by_name'
        ]
        read_only_fields = ['created_at']


class ReportScheduleSerializer(BaseSerializer):
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)

    class Meta:
        model = ReportSchedule
        fields = [
            'id', 'template', 'template_name', 'name', 'frequency',
            'frequency_display', 'status', 'status_display', 'run_time',
            'day_of_week', 'day_of_month', 'recipients', 'filters',
            'last_run_at', 'next_run_at', 'created_at',
            'created_by_name', 'updated_by_name'
        ]
        read_only_fields = ['created_at', 'last_run_at', 'next_run_at']


class ReportInstanceSerializer(BaseSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True, default=None)

    class Meta:
        model = ReportInstance
        fields = [
            'id', 'template', 'template_name', 'schedule', 'name',
            'report_type', 'status', 'status_display', 'parameters',
            'filters', 'summary_data', 'chart_data', 'file_path',
            'file_size', 'record_count', 'started_at', 'completed_at',
            'error_message', 'expires_at', 'period_start', 'period_end',
            'created_at', 'created_by_name'
        ]
        read_only_fields = [
            'created_at', 'started_at', 'completed_at', 'file_path',
            'file_size', 'record_count', 'summary_data', 'chart_data',
            'error_message'
        ]


class DashboardWidgetSerializer(BaseSerializer):
    widget_type_display = serializers.CharField(source='get_widget_type_display', read_only=True)
    size_display = serializers.CharField(source='get_size_display', read_only=True)

    class Meta:
        model = DashboardWidget
        fields = [
            'id', 'name', 'widget_type', 'widget_type_display', 'size',
            'size_display', 'data_source', 'config', 'position',
            'is_active', 'refresh_interval', 'created_at',
            'created_by_name', 'updated_by_name'
        ]
        read_only_fields = ['created_at']


class DurationStatsSerializer(serializers.Serializer):
    avg_first_response = serializers.FloatField()
    avg_resolution = serializers.FloatField()
    avg_total = serializers.FloatField()
    by_type = serializers.DictField()
    by_priority = serializers.DictField()
    by_assignee = serializers.ListField()
    by_period = serializers.ListField()


class ResultStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    resolved = serializers.IntegerField()
    closed = serializers.IntegerField()
    resolution_rate = serializers.FloatField()
    avg_satisfaction = serializers.FloatField()
    satisfaction_distribution = serializers.DictField()
    by_result = serializers.DictField()
    by_type = serializers.DictField()


class TrendStatsSerializer(serializers.Serializer):
    period = serializers.CharField()
    new_tickets = serializers.IntegerField()
    resolved_tickets = serializers.IntegerField()
    closed_tickets = serializers.IntegerField()
    avg_response_time = serializers.FloatField()
    avg_resolution_time = serializers.FloatField()


class TrendReportSerializer(serializers.Serializer):
    trends = TrendStatsSerializer(many=True)
    summary = serializers.DictField()
