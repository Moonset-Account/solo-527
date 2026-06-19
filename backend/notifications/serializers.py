from rest_framework import serializers
from .models import Notification
from common.serializers import ProductionDataSerializerMixin


class NotificationSerializer(ProductionDataSerializerMixin, serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    channel_display = serializers.CharField(source='get_channel_display', read_only=True)

    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = [
            'created_by', 'updated_by', 'sent_at', 'read_at',
            'is_sent', 'error_message'
        ]


class NotificationCreateSerializer(serializers.Serializer):
    user_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        help_text='接收用户ID列表'
    )
    title = serializers.CharField(required=True, max_length=200)
    content = serializers.CharField(required=True)
    type = serializers.ChoiceField(choices=Notification.TYPE_CHOICES, default='system')
    channel = serializers.ChoiceField(choices=Notification.CHANNEL_CHOICES, default='in_app')
    related_id = serializers.IntegerField(required=False)
    related_type = serializers.CharField(required=False, max_length=50)
    scheduled_at = serializers.DateTimeField(required=False)


class NotificationMarkReadSerializer(serializers.Serializer):
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text='通知ID列表，为空则标记所有为已读'
    )
