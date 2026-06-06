from rest_framework import serializers
from .models import Notification, NotificationRead, NotificationAttachment, Message
from apps.accounts.serializers import UserSerializer


class NotificationAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationAttachment
        fields = ['id', 'notification', 'file', 'file_name', 'file_size']


class NotificationReadSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = NotificationRead
        fields = ['id', 'notification', 'user', 'user_name', 'read_at', 'ack_at']


class NotificationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    target_type_display = serializers.CharField(source='get_target_type_display', read_only=True)
    published_by_name = serializers.CharField(source='published_by.name', read_only=True)
    attachments = NotificationAttachmentSerializer(many=True, read_only=True)
    read_count = serializers.IntegerField(read_only=True)
    is_read = serializers.BooleanField(read_only=True)
    is_ack = serializers.BooleanField(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'title', 'content', 'type', 'type_display', 'status', 'status_display',
                  'target_type', 'target_type_display', 'target_classes', 'target_children',
                  'target_users', 'published_at', 'published_by', 'published_by_name',
                  'need_ack', 'deadline', 'attachments', 'read_count', 'is_read', 'is_ack']
        read_only_fields = ['published_at', 'published_by', 'read_count']


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.name', read_only=True)
    receiver_name = serializers.CharField(source='receiver.name', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    child_name = serializers.CharField(source='related_child.name', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_name', 'receiver', 'receiver_name',
                  'content', 'type', 'type_display', 'attachment', 'is_read',
                  'read_at', 'related_child', 'child_name', 'created_at']
        read_only_fields = ['sender', 'is_read', 'read_at', 'created_at']
