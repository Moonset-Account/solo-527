from rest_framework import serializers
from .models import Topic, TopicProcessRecord, TopicComment
from common.serializers import ProductionDataSerializerMixin
from users.serializers import UserSerializer


class TopicCommentSerializer(ProductionDataSerializerMixin, serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = TopicComment
        fields = '__all__'
        read_only_fields = ['created_by', 'updated_by', 'author']

    def get_author_name(self, obj):
        if obj.is_anonymous:
            return '匿名用户'
        return obj.author.get_full_name() or obj.author.username


class TopicProcessRecordSerializer(serializers.ModelSerializer):
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)
    status_change_display = serializers.CharField(source='get_status_change_display', read_only=True)

    class Meta:
        model = TopicProcessRecord
        fields = '__all__'
        read_only_fields = ['processed_by', 'processed_at']


class TopicSerializer(ProductionDataSerializerMixin, serializers.ModelSerializer):
    proposed_by = UserSerializer(read_only=True)
    representative = UserSerializer(read_only=True)
    representative_id = serializers.IntegerField(write_only=True, required=False)
    process_records = TopicProcessRecordSerializer(many=True, read_only=True)
    comments = TopicCommentSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    total_votes = serializers.IntegerField(read_only=True)
    yes_votes = serializers.IntegerField(read_only=True)
    no_votes = serializers.IntegerField(read_only=True)
    abstain_votes = serializers.IntegerField(read_only=True)
    voting_result = serializers.CharField(read_only=True)
    is_voting_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = Topic
        fields = '__all__'
        read_only_fields = ['created_by', 'updated_by', 'proposed_by', 'voting_result']


class TopicDetailSerializer(TopicSerializer):
    class Meta(TopicSerializer.Meta):
        depth = 1


class TopicStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Topic.STATUS_CHOICES, required=True)
    remark = serializers.CharField(required=False, allow_blank=True)


class TopicCommentCreateSerializer(serializers.Serializer):
    content = serializers.CharField(required=True)
    is_anonymous = serializers.BooleanField(required=False, default=False)


class TopicProcessCreateSerializer(serializers.Serializer):
    content = serializers.CharField(required=True)
    remark = serializers.CharField(required=False, allow_blank=True)
