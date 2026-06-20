from rest_framework import serializers
from .models import NotificationRule, Notification
from apps.serializers import BaseModelSerializer


class NotificationRuleSerializer(BaseModelSerializer):
    trigger_display = serializers.CharField(source='get_trigger_display', read_only=True)
    method_display = serializers.CharField(source='get_method_display', read_only=True)
    recipient_count = serializers.IntegerField(read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = NotificationRule
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'name', 'trigger', 'trigger_display',
            'method', 'method_display', 'alert_levels',
            'recipients', 'recipient_emails', 'template',
            'is_active', 'description', 'recipient_count'
        ]


class NotificationSerializer(BaseModelSerializer):
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    recipient_name = serializers.CharField(source='recipient.name', read_only=True)
    rule_name = serializers.CharField(source='rule.name', read_only=True)
    read_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = Notification
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'recipient', 'recipient_name', 'title', 'content',
            'notification_type', 'notification_type_display',
            'status', 'status_display', 'related_type', 'related_id',
            'rule', 'rule_name', 'read_at'
        ]
