from rest_framework import serializers
from .models import Alert, AlertRecord, AlertAttachment, AlertHistory
from apps.serializers import BaseModelSerializer


class AlertRecordSerializer(BaseModelSerializer):
    processed_by_name = serializers.CharField(source='processed_by.name', read_only=True)
    old_status_display = serializers.CharField(source='get_old_status_display', read_only=True)
    new_status_display = serializers.CharField(source='get_new_status_display', read_only=True)
    processed_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = AlertRecord
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'alert', 'action', 'old_status', 'old_status_display',
            'new_status', 'new_status_display', 'comment',
            'processed_at', 'processed_by', 'processed_by_name'
        ]


class AlertAttachmentSerializer(BaseModelSerializer):
    file_url = serializers.SerializerMethodField()
    uploaded_by_name = serializers.CharField(source='created_by.name', read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = AlertAttachment
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'alert', 'file', 'file_url', 'file_name', 'file_size',
            'content_type', 'uploaded_by_name'
        ]

    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return ''


class AlertHistorySerializer(BaseModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.name', read_only=True)
    changed_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = AlertHistory
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'alert', 'field', 'old_value', 'new_value',
            'changed_at', 'changed_by', 'changed_by_name'
        ]


class AlertListSerializer(BaseModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    server_name = serializers.CharField(source='server.name', read_only=True)
    server_ip = serializers.CharField(source='server.ip_address', read_only=True)
    handler_name = serializers.CharField(source='handler.name', read_only=True)
    occurred_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = Alert
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'code', 'title', 'source', 'source_display',
            'level', 'level_display', 'status', 'status_display',
            'server', 'server_name', 'server_ip',
            'handler', 'handler_name', 'occurred_at'
        ]


class AlertDetailSerializer(BaseModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    server_name = serializers.CharField(source='server.name', read_only=True)
    server_ip = serializers.CharField(source='server.ip_address', read_only=True)
    handler_name = serializers.CharField(source='handler.name', read_only=True)
    acknowledged_by_name = serializers.CharField(source='acknowledged_by.name', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.name', read_only=True)
    closed_by_name = serializers.CharField(source='closed_by.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    change_window_name = serializers.CharField(source='change_window.name', read_only=True)
    records = AlertRecordSerializer(many=True, read_only=True)
    attachments = AlertAttachmentSerializer(many=True, read_only=True)
    histories = AlertHistorySerializer(many=True, read_only=True)
    occurred_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    acknowledged_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    processed_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    closed_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = Alert
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'code', 'title', 'content', 'source', 'source_display',
            'level', 'level_display', 'status', 'status_display',
            'server', 'server_name', 'server_ip',
            'change_window', 'change_window_name',
            'category', 'category_name',
            'metric', 'metric_value', 'threshold',
            'occurred_at', 'acknowledged_at', 'acknowledged_by', 'acknowledged_by_name',
            'processed_at', 'processed_by', 'processed_by_name',
            'closed_at', 'closed_by', 'closed_by_name',
            'handler', 'handler_name',
            'solution', 'root_cause', 'review_summary',
            'records', 'attachments', 'histories'
        ]


class AlertCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = [
            'title', 'content', 'source', 'level', 'server',
            'change_window', 'category', 'metric', 'metric_value',
            'threshold', 'occurred_at', 'handler'
        ]


class AlertUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = [
            'title', 'content', 'level', 'server',
            'change_window', 'category', 'metric', 'metric_value',
            'threshold', 'handler', 'solution', 'root_cause', 'review_summary'
        ]


class AlertActionSerializer(serializers.Serializer):
    comment = serializers.CharField(required=False, allow_blank=True)
    handler = serializers.IntegerField(required=False, allow_null=True)
