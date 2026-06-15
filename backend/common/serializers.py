from rest_framework import serializers
from .models import OperationLog, SystemConfig, PublicSeaRule
from django.contrib.contenttypes.models import ContentType


class OperationLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    model_name = serializers.CharField(source='content_type.model', read_only=True)

    class Meta:
        model = OperationLog
        fields = [
            'id', 'user', 'user_name', 'action', 'content_type', 'model_name',
            'object_id', 'description', 'old_values', 'new_values', 'ip_address', 'created_at'
        ]
        read_only_fields = ['created_at']


class SystemConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemConfig
        fields = ['id', 'key', 'value', 'description', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PublicSeaRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicSeaRule
        fields = ['id', 'name', 'description', 'timeout_days', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']
