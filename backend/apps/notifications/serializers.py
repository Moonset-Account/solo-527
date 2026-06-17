from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    is_read_by_current = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'type', 'type_display', 'level', 'level_display', 'title',
                  'message', 'related_type', 'related_id', 'is_read_by_current',
                  'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_is_read_by_current(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if user:
            return obj.read_by.filter(id=user.id).exists()
        return False
