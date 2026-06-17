from rest_framework import serializers
from .models import KnowledgeItem, KnowledgeQuery
from apps.core.serializers import BaseSerializer


class KnowledgeItemSerializer(BaseSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    related_items_data = serializers.SerializerMethodField()

    class Meta:
        model = KnowledgeItem
        fields = [
            'id', 'title', 'content', 'summary', 'status', 'status_display',
            'category', 'category_display', 'keywords', 'view_count',
            'helpful_count', 'not_helpful_count', 'hit_count', 'is_tutorial',
            'published_at', 'tags', 'related_items', 'related_items_data',
            'created_at', 'created_by_name', 'updated_by_name'
        ]
        read_only_fields = [
            'created_at', 'view_count', 'helpful_count', 'not_helpful_count',
            'hit_count', 'published_at'
        ]

    def get_related_items_data(self, obj):
        related = obj.related_items.filter(status=KnowledgeItem.Status.PUBLISHED)[:10]
        return KnowledgeItemSimpleSerializer(related, many=True).data


class KnowledgeItemSimpleSerializer(BaseSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = KnowledgeItem
        fields = ['id', 'title', 'summary', 'category', 'category_display', 'is_tutorial', 'view_count']


class KnowledgeQuerySerializer(BaseSerializer):
    matched_item_title = serializers.CharField(source='matched_item.title', read_only=True, default=None)
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = KnowledgeQuery
        fields = [
            'id', 'query_text', 'user', 'user_name', 'matched_item', 'matched_item_title',
            'match_score', 'is_helpful', 'has_reminder', 'source', 'created_at'
        ]
        read_only_fields = ['created_at']


class KnowledgeReminderSerializer(serializers.Serializer):
    has_reminder = serializers.BooleanField(required=True)
