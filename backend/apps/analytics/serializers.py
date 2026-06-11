from rest_framework import serializers
from .models import AccuracyStats, DailyStats, UsageStats, TokenUsage


class AccuracyStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccuracyStats
        fields = [
            'id', 'date', 'sales_operation', 'prompt_version',
            'total_calls', 'accurate_calls', 'accuracy_rate',
            'error_timeout', 'error_rate_limit', 'error_api_error',
            'error_content_filter', 'error_other', 'avg_response_time', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class DailyStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyStats
        fields = [
            'id', 'date', 'total_conversations', 'total_messages',
            'ai_suggestion_count', 'ai_adoption_count', 'ai_adoption_rate',
            'total_reviews', 'approved_reviews', 'rejected_reviews', 'pending_reviews',
            'total_risks', 'resolved_risks', 'avg_response_time',
            'total_tokens', 'total_cost', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class StatsOverviewSerializer(serializers.Serializer):
    total_conversations = serializers.IntegerField()
    total_messages = serializers.IntegerField()
    total_ai_calls = serializers.IntegerField()
    total_reviews = serializers.IntegerField()
    total_risks = serializers.IntegerField()
    accuracy_rate = serializers.FloatField()
    ai_adoption_rate = serializers.FloatField()
    approval_rate = serializers.FloatField()
    risk_resolution_rate = serializers.FloatField()
    total_tokens = serializers.IntegerField()
    total_cost = serializers.DecimalField(max_digits=12, decimal_places=6)


class ErrorStatsSerializer(serializers.Serializer):
    error_type = serializers.CharField()
    count = serializers.IntegerField()
    percentage = serializers.FloatField()


class SalesOperationRankingSerializer(serializers.Serializer):
    sales_operation = serializers.CharField()
    total_calls = serializers.IntegerField()
    accurate_calls = serializers.IntegerField()
    accuracy_rate = serializers.FloatField()


class PromptVersionRankingSerializer(serializers.Serializer):
    prompt_version = serializers.CharField()
    total_calls = serializers.IntegerField()
    accurate_calls = serializers.IntegerField()
    accuracy_rate = serializers.FloatField()


class UsageStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UsageStats
        fields = ['id', 'date', 'total_conversations', 'total_messages', 'total_tokens',
                  'active_users', 'new_users', 'api_calls', 'avg_response_time', 'created_at']
        read_only_fields = ['id', 'created_at']


class TokenUsageSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = TokenUsage
        fields = ['id', 'user', 'user_name', 'date', 'model', 'prompt_tokens',
                  'completion_tokens', 'total_tokens', 'cost', 'created_at']
        read_only_fields = ['id', 'created_at']
