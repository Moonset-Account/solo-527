from rest_framework import serializers
from .models import ChangeWindow, ChangeLog
from apps.serializers import BaseModelSerializer


class ChangeLogSerializer(BaseModelSerializer):
    action = serializers.CharField()
    old_status_display = serializers.CharField(source='get_old_status_display', read_only=True)
    new_status_display = serializers.CharField(source='get_new_status_display', read_only=True)
    operator_name = serializers.CharField(source='operator.name', read_only=True)
    operated_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = ChangeLog
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'change_window', 'action', 'old_status', 'old_status_display',
            'new_status', 'new_status_display', 'detail', 'is_failure',
            'failure_reason', 'operator', 'operator_name', 'operated_at'
        ]


class ChangeWindowListSerializer(BaseModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    change_type_display = serializers.CharField(source='get_change_type_display', read_only=True)
    applicant_name = serializers.CharField(source='applicant.name', read_only=True)
    approver_name = serializers.CharField(source='approver.name', read_only=True)
    executor_name = serializers.CharField(source='executor.name', read_only=True)
    start_time = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    end_time = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    server_count = serializers.IntegerField(read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = ChangeWindow
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'code', 'name', 'change_type', 'change_type_display',
            'status', 'status_display', 'start_time', 'end_time',
            'applicant', 'applicant_name', 'approver', 'approver_name',
            'executor', 'executor_name', 'server_count'
        ]


class ChangeWindowDetailSerializer(BaseModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    change_type_display = serializers.CharField(source='get_change_type_display', read_only=True)
    applicant_name = serializers.CharField(source='applicant.name', read_only=True)
    approver_name = serializers.CharField(source='approver.name', read_only=True)
    executor_name = serializers.CharField(source='executor.name', read_only=True)
    start_time = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S')
    end_time = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S')
    actual_start = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    actual_end = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    approved_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    logs = ChangeLogSerializer(many=True, read_only=True)
    server_names = serializers.SerializerMethodField()

    class Meta(BaseModelSerializer.Meta):
        model = ChangeWindow
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'code', 'name', 'change_type', 'change_type_display',
            'status', 'status_display', 'description', 'plan_content',
            'rollback_plan', 'risk_assessment',
            'start_time', 'end_time', 'actual_start', 'actual_end',
            'applicant', 'applicant_name', 'approver', 'approver_name',
            'executor', 'executor_name', 'approved_at',
            'result_summary', 'servers', 'server_names', 'logs'
        ]

    def get_server_names(self, obj):
        return [{'id': s.id, 'name': s.name, 'ip': s.ip_address} for s in obj.servers.all()]


class ChangeWindowCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChangeWindow
        fields = [
            'name', 'change_type', 'description', 'plan_content',
            'rollback_plan', 'risk_assessment', 'start_time', 'end_time',
            'executor', 'servers'
        ]


class ChangeActionSerializer(serializers.Serializer):
    comment = serializers.CharField(required=False, allow_blank=True)
    is_failure = serializers.BooleanField(required=False, default=False)
    failure_reason = serializers.CharField(required=False, allow_blank=True)
