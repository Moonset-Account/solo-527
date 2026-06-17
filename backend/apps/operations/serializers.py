from rest_framework import serializers
from .models import QualityCheck, ImprovementAction, ExportRecord
from apps.core.serializers import BaseSerializer


class QualityCheckSerializer(BaseSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    ticket_no = serializers.CharField(source='ticket.ticket_no', read_only=True)
    ticket_title = serializers.CharField(source='ticket.title', read_only=True)
    checker_name = serializers.CharField(source='checker.username', read_only=True)

    class Meta:
        model = QualityCheck
        fields = [
            'id', 'ticket', 'ticket_no', 'ticket_title', 'checker', 'checker_name',
            'status', 'status_display', 'score', 'check_items', 'comments',
            'issues_found', 'suggestions', 'checked_at', 'remarks',
            'created_at', 'created_by_name', 'updated_by_name'
        ]
        read_only_fields = ['created_at', 'checked_at']


class ImprovementActionSerializer(BaseSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    assignee_name = serializers.CharField(source='assignee.username', read_only=True)
    quality_check_ticket = serializers.CharField(
        source='quality_check.ticket.ticket_no', read_only=True, default=None
    )
    related_ticket_no = serializers.CharField(
        source='related_ticket.ticket_no', read_only=True, default=None
    )
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = ImprovementAction
        fields = [
            'id', 'title', 'description', 'status', 'status_display',
            'priority', 'priority_display', 'quality_check', 'quality_check_ticket',
            'related_ticket', 'related_ticket_no', 'assignee', 'assignee_name',
            'due_date', 'is_overdue', 'progress', 'completed_at', 'solution',
            'result', 'tags', 'created_at', 'created_by_name', 'updated_by_name'
        ]
        read_only_fields = ['created_at', 'completed_at']

    def get_is_overdue(self, obj):
        from django.utils import timezone
        if obj.status in ['pending', 'in_progress'] and obj.due_date:
            return timezone.now().date() > obj.due_date
        return False


class ExportRecordSerializer(BaseSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    export_type_display = serializers.CharField(source='get_export_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    previous_export_file = serializers.CharField(
        source='previous_export.file_name', read_only=True, default=None
    )
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = ExportRecord
        fields = [
            'id', 'export_type', 'export_type_display', 'status', 'status_display',
            'file_name', 'file_path', 'file_size', 'filters', 'filter_hash',
            'record_count', 'created_by', 'created_by_name', 'previous_export',
            'previous_export_file', 'started_at', 'completed_at', 'error_message',
            'expires_at', 'created_at', 'download_url'
        ]
        read_only_fields = [
            'created_at', 'started_at', 'completed_at', 'file_path', 'file_size',
            'record_count', 'error_message', 'filter_hash', 'download_url'
        ]

    def get_download_url(self, obj):
        if obj.file_path and obj.status == 'completed':
            return obj.file_path.url
        return None


class ExportCheckDuplicateSerializer(serializers.Serializer):
    export_type = serializers.ChoiceField(
        choices=ExportRecord.ExportType.choices,
        required=True
    )
    filters = serializers.DictField(required=True)
