from rest_framework import serializers
from .models import Review, ReviewRule
from apps.conversations.models import Message


class ReviewListSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.username', read_only=True)
    message_content = serializers.CharField(source='message.content', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    review_type_display = serializers.CharField(source='get_review_type_display', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'message', 'message_content', 'review_type', 'review_type_display',
            'status', 'status_display', 'risk_level', 'reviewer', 'reviewer_name',
            'created_at', 'sales_operation', 'prompt_version'
        ]


class ReviewDetailSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.username', read_only=True)
    message_content = serializers.CharField(source='message.content', read_only=True)
    message_role = serializers.CharField(source='message.role', read_only=True)
    conversation_id = serializers.IntegerField(source='message.conversation_id', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    review_type_display = serializers.CharField(source='get_review_type_display', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'message', 'message_content', 'message_role', 'conversation_id',
            'review_type', 'review_type_display', 'status', 'status_display',
            'reviewer', 'reviewer_name', 'comment', 'risk_level', 'flagged_by_ai',
            'sales_operation', 'prompt_version', 'ai_model', 'is_accurate',
            'inaccuracy_reason', 'risk_tags', 'created_at', 'reviewed_at'
        ]


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = [
            'message', 'review_type', 'status', 'comment', 'risk_level',
            'flagged_by_ai', 'sales_operation', 'prompt_version', 'ai_model',
            'is_accurate', 'inaccuracy_reason', 'risk_tags'
        ]

    def validate_message(self, value):
        if not Message.objects.filter(id=value.id).exists():
            raise serializers.ValidationError('消息不存在')
        return value


class ReviewActionSerializer(serializers.Serializer):
    comment = serializers.CharField(required=False, allow_blank=True, max_length=1000)
    risk_level = serializers.CharField(required=False, allow_blank=True, max_length=20)
    is_accurate = serializers.BooleanField(required=False, allow_null=True)
    inaccuracy_reason = serializers.CharField(required=False, allow_blank=True, max_length=100)


class ReviewBatchActionSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        max_length=100,
        error_messages={'min_length': '至少选择一条记录', 'max_length': '最多处理100条记录'}
    )
    action = serializers.ChoiceField(choices=['approve', 'reject', 'flag'])
    comment = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class ReviewRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewRule
        fields = ['id', 'name', 'description', 'rule_type', 'pattern', 'is_active',
                  'severity', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
