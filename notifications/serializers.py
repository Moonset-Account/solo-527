from rest_framework import serializers
from .models import SMSMessage, Notification


class SMSMessageSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    message_type_display = serializers.CharField(source='get_message_type_display', read_only=True)

    class Meta:
        model = SMSMessage
        fields = [
            'id', 'patient', 'appointment', 'message_type',
            'message_type_display', 'phone_number', 'content',
            'status', 'status_display', 'sent_at', 'delivered_at',
            'scheduled_send_time', 'created_at', 'created_by'
        ]
        read_only_fields = [
            'id', 'provider_message_id', 'sent_at', 'delivered_at',
            'error_message', 'retry_count', 'created_at', 'created_by'
        ]


class NotificationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'type', 'type_display',
            'status', 'status_display', 'related_url',
            'read_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'read_at']
