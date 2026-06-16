from rest_framework import serializers
from .models import Notification, UserNotification, Announcement, NotificationType
from apps.users.serializers import UserSerializer


class NotificationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    sender_info = UserSerializer(source='sender', read_only=True)
    priority_display = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'title', 'content', 'type', 'type_display', 'sender', 'sender_info',
                  'repair_request', 'created_at', 'is_published', 'priority', 'priority_display']
        read_only_fields = ['created_at']

    def get_priority_display(self, obj):
        priority_map = {'normal': '普通', 'important': '重要', 'urgent': '紧急'}
        return priority_map.get(obj.priority, obj.priority)


class UserNotificationSerializer(serializers.ModelSerializer):
    notification = NotificationSerializer(read_only=True)
    notification_id = serializers.PrimaryKeyRelatedField(
        queryset=Notification.objects.all(), source='notification', write_only=True
    )
    user_info = UserSerializer(source='user', read_only=True)

    class Meta:
        model = UserNotification
        fields = ['id', 'notification', 'notification_id', 'user', 'user_info', 'is_read', 'read_at']
        read_only_fields = ['read_at']


class AnnouncementSerializer(serializers.ModelSerializer):
    author_info = UserSerializer(source='author', read_only=True)

    class Meta:
        model = Announcement
        fields = ['id', 'title', 'content', 'author', 'author_info', 'target_roles',
                  'target_buildings', 'is_top', 'is_published', 'published_at',
                  'expires_at', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class AnnouncementCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ['title', 'content', 'target_roles', 'target_buildings',
                  'is_top', 'is_published', 'expires_at']
