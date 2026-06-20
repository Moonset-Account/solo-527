from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    created_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'username', 'action', 'action_display',
            'resource_type', 'resource_id', 'resource_name',
            'method', 'path', 'ip_address', 'status_code',
            'detail', 'is_success', 'error_message', 'duration_ms', 'created_at'
        ]
