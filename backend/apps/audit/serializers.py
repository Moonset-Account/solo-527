from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    operation_display = serializers.CharField(source='get_operation_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'username', 'operation', 'operation_display', 'module',
                  'description', 'object_id', 'old_data', 'new_data',
                  'ip_address', 'created_at']
        read_only_fields = ['created_at']
