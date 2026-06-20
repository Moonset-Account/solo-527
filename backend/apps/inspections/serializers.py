from rest_framework import serializers
from .models import InspectionTemplate, InspectionItem, InspectionTask, InspectionResult
from apps.serializers import BaseModelSerializer


class InspectionItemSerializer(BaseModelSerializer):
    item_type_display = serializers.CharField(source='get_item_type_display', read_only=True)
    operator_display = serializers.CharField(source='get_operator_display', read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = InspectionItem
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'template', 'name', 'item_type', 'item_type_display',
            'metric', 'operator', 'operator_display', 'threshold',
            'warning_value', 'critical_value', 'description', 'sort_order'
        ]


class InspectionTemplateListSerializer(BaseModelSerializer):
    item_count = serializers.IntegerField(read_only=True)
    task_count = serializers.IntegerField(read_only=True)
    items_count = serializers.IntegerField(read_only=True)
    template_type_display = serializers.CharField(source='get_template_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True, allow_null=True)

    class Meta(BaseModelSerializer.Meta):
        model = InspectionTemplate
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'name', 'code', 'template_type', 'template_type_display',
            'description', 'cron_expression', 'timeout_seconds',
            'is_active', 'is_enabled',
            'item_count', 'task_count', 'items_count', 'created_by_name'
        ]


class InspectionTemplateDetailSerializer(BaseModelSerializer):
    items = InspectionItemSerializer(many=True, read_only=True)
    group_names = serializers.ListField(source='groups.values_list', read_only=True)
    server_names = serializers.ListField(source='servers.values_list', read_only=True)
    template_type_display = serializers.CharField(source='get_template_type_display', read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = InspectionTemplate
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'name', 'code', 'template_type', 'template_type_display',
            'description', 'cron_expression', 'timeout_seconds',
            'is_active', 'is_enabled',
            'groups', 'servers', 'items', 'group_names', 'server_names'
        ]


class InspectionTaskListSerializer(BaseModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    trigger_type_display = serializers.CharField(source='get_trigger_type_display', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    triggered_by_name = serializers.CharField(source='triggered_by.name', read_only=True, allow_null=True)
    executed_by_name = serializers.CharField(source='triggered_by.name', read_only=True, allow_null=True)
    started_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    finished_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = InspectionTask
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'code', 'name', 'template', 'template_name',
            'status', 'status_display', 'trigger_type', 'trigger_type_display',
            'started_at', 'finished_at', 'duration_seconds',
            'total_count', 'success_count', 'warning_count',
            'critical_count', 'failed_count', 'timeout_count',
            'triggered_by', 'triggered_by_name', 'executed_by_name'
        ]


class InspectionResultSerializer(BaseModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)
    server_name = serializers.CharField(source='server.name', read_only=True)
    server_ip = serializers.CharField(source='server.ip_address', read_only=True)
    checked_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = InspectionResult
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'task', 'item', 'item_name', 'server',
            'server_name', 'server_ip', 'status', 'status_display',
            'actual_value', 'expected_value', 'message', 'checked_at'
        ]


class InspectionTaskDetailSerializer(InspectionTaskListSerializer):
    results = InspectionResultSerializer(many=True, read_only=True)

    class Meta(InspectionTaskListSerializer.Meta):
        fields = InspectionTaskListSerializer.Meta.fields + ['results', 'result_summary']
