from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            'id', 'role', 'content', 'tokens_used',
            'is_ai_suggestion', 'is_adopted', 'ai_model', 'prompt_version',
            'error_type', 'error_message', 'suggested_reply', 'review_status',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'tokens_used', 'error_type', 'error_message']


class MessageSendSerializer(serializers.Serializer):
    content = serializers.CharField(required=True, max_length=5000)


class AISuggestionSerializer(serializers.Serializer):
    message_id = serializers.IntegerField(read_only=True)
    suggested_reply = serializers.CharField(read_only=True)
    ai_model = serializers.CharField(read_only=True)
    prompt_version = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)


class ConversationListSerializer(serializers.ModelSerializer):
    messages_count = serializers.IntegerField(read_only=True)
    last_message_time = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Conversation
        fields = [
            'id', 'title', 'customer_name', 'customer_phone',
            'sales_operation', 'channel', 'priority', 'status',
            'messages_count', 'last_message_time', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'messages_count', 'last_message_time']


class ConversationDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    messages_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Conversation
        fields = [
            'id', 'title', 'customer_name', 'customer_phone',
            'sales_operation', 'channel', 'priority', 'status',
            'ai_suggestion_adoption_rate', 'messages_count',
            'messages', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'ai_suggestion_adoption_rate', 'messages_count']


class ConversationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = [
            'title', 'customer_name', 'customer_phone',
            'sales_operation', 'channel', 'priority'
        ]

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class MessageUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['content', 'review_status']
