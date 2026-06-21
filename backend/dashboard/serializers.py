from rest_framework import serializers
from .models import Notification, DashboardWidget, OperationLog


class NotificationSerializer(serializers.ModelSerializer):
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_read = serializers.SerializerMethodField()
    handled_by_name = serializers.CharField(source='handled_by.get_full_name', read_only=True, allow_null=True)
    related_contract_number = serializers.CharField(source='related_contract.contract_number', read_only=True, allow_null=True)
    recipients_info = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'notification_type_display',
            'priority', 'priority_display', 'title', 'content',
            'related_contract', 'related_contract_number',
            'recipients', 'recipients_info', 'is_read',
            'is_handled', 'handled_by', 'handled_by_name',
            'handled_at', 'handle_result', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_is_read(self, obj):
        user = self.context.get('request').user
        return user in obj.read_by.all()

    def get_recipients_info(self, obj):
        from users.serializers import UserSerializer
        return UserSerializer(obj.recipients.all(), many=True).data


class DashboardWidgetSerializer(serializers.ModelSerializer):
    widget_type_display = serializers.CharField(source='get_widget_type_display', read_only=True)

    class Meta:
        model = DashboardWidget
        fields = [
            'id', 'widget_type', 'widget_type_display', 'title', 'config', 'position', 'is_visible', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class OperationLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = OperationLog
        fields = [
            'id', 'user', 'user_name', 'action', 'module',
            'target_type', 'target_id', 'description',
            'ip_address', 'user_agent', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
