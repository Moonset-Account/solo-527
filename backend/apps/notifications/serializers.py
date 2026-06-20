from rest_framework import serializers
from .models import NotificationRule, Notification
from apps.serializers import BaseModelSerializer


class NotificationRuleSerializer(BaseModelSerializer):
    trigger_display = serializers.CharField(source='get_trigger_display', read_only=True)
    method_display = serializers.CharField(source='get_method_display', read_only=True)
    event_type = serializers.CharField(source='trigger', read_only=True)
    event_type_display = serializers.CharField(source='get_trigger_display', read_only=True)
    recipient_count = serializers.IntegerField(read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = NotificationRule
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'name', 'trigger', 'trigger_display',
            'event_type', 'event_type_display',
            'method', 'method_display', 'channels',
            'alert_levels', 'severity_level',
            'recipients', 'recipient_count', 'recipient_emails',
            'template', 'is_active', 'is_enabled', 'description'
        ]

    def validate_event_type(self, value):
        valid = [c[0] for c in NotificationRule.TRIGGER_CHOICES]
        if value not in valid:
            raise serializers.ValidationError(f'无效的事件类型: {value}')
        return value

    def create(self, validated_data):
        if 'event_type' in self.initial_data and 'trigger' not in validated_data:
            validated_data['trigger'] = self.initial_data['event_type']
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'event_type' in self.initial_data and 'trigger' not in validated_data:
            validated_data['trigger'] = self.initial_data['event_type']
        return super().update(instance, validated_data)


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
