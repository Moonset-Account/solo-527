from rest_framework import serializers

from apps.audit.models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='action_display', read_only=True)
    changed_by_name = serializers.CharField(source='changed_by_name', read_only=True)
    diff = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'id', 'action', 'action_display', 'model_name',
            'object_id', 'object_uuid', 'object_name',
            'changed_by', 'changed_by_name', 'ip_address',
            'old_values', 'new_values', 'diff', 'changed_at'
        ]
        read_only_fields = fields

    def get_diff(self, obj):
        return obj.get_field_diffs()


class AuditLogDiffSerializer(serializers.Serializer):
    field = serializers.CharField()
    old_value = serializers.JSONField()
    new_value = serializers.JSONField()
    changed = serializers.BooleanField()
    diff_html = serializers.CharField()
