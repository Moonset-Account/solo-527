from rest_framework import serializers
from .models import Notification, NotificationRead


class NotificationReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationRead
        fields = '__all__'
        read_only_fields = ['id', 'read_at']


class NotificationSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, default='')
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_is_read(self, obj):
        user = self.context.get('request').user
        return NotificationRead.objects.filter(notification=obj, user=user).exists()
