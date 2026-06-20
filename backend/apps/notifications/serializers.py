from rest_framework import serializers
from .models import NotificationRule, Notification
from apps.serializers import BaseModelSerializer


class NotificationRuleSerializer(BaseModelSerializer):
    trigger_display = serializers.CharField(source='get_trigger_display', read_only=True)
    method_display = serializers.CharField(source='get_method_display', read_only=True)
    event_type = serializers.ChoiceField(
        choices=NotificationRule.TRIGGER_CHOICES,
        source='trigger',
        required=False,
    )
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
        extra_kwargs = {
            'trigger': {'required': False},
        }

    def validate(self, attrs):
        trigger_in_raw = 'trigger' in self.initial_data
        event_type_in_raw = 'event_type' in self.initial_data
        if not trigger_in_raw and not event_type_in_raw:
            if not self.instance:
                raise serializers.ValidationError('必须提供 trigger 或 event_type')
        if trigger_in_raw and event_type_in_raw:
            if self.initial_data['trigger'] != self.initial_data['event_type']:
                raise serializers.ValidationError('trigger 与 event_type 值不一致')
        return attrs


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
