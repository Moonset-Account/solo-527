from rest_framework import serializers
from .models import RiskSample, RiskRule


class RiskSampleListSerializer(serializers.ModelSerializer):
    risk_level_display = serializers.CharField(source='get_risk_level_display', read_only=True)
    risk_category_display = serializers.CharField(source='get_risk_category_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assignee_name = serializers.CharField(source='assignee.username', read_only=True)

    class Meta:
        model = RiskSample
        fields = [
            'id', 'title', 'risk_level', 'risk_level_display',
            'risk_category', 'risk_category_display', 'source', 'source_display',
            'status', 'status_display', 'tags', 'assignee', 'assignee_name',
            'created_at', 'updated_at'
        ]


class RiskSampleDetailSerializer(serializers.ModelSerializer):
    risk_level_display = serializers.CharField(source='get_risk_level_display', read_only=True)
    risk_category_display = serializers.CharField(source='get_risk_category_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    assignee_name = serializers.CharField(source='assignee.username', read_only=True)
    handled_by_name = serializers.CharField(source='handled_by.username', read_only=True)
    conversation_title = serializers.CharField(source='conversation.title', read_only=True)
    message_content = serializers.CharField(source='message.content', read_only=True)

    class Meta:
        model = RiskSample
        fields = [
            'id', 'title', 'content', 'risk_level', 'risk_level_display',
            'risk_category', 'risk_category_display', 'source', 'source_display',
            'status', 'status_display', 'tags', 'conversation', 'conversation_title',
            'message', 'message_content', 'assignee', 'assignee_name',
            'handled_by', 'handled_by_name', 'handle_comment', 'handled_at',
            'created_at', 'updated_at'
        ]


class RiskSampleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RiskSample
        fields = [
            'title', 'content', 'risk_level', 'risk_category',
            'source', 'status', 'tags', 'conversation', 'message', 'assignee'
        ]


class RiskSampleActionSerializer(serializers.Serializer):
    handle_comment = serializers.CharField(required=False, allow_blank=True, max_length=2000)
    assignee = serializers.IntegerField(required=False, allow_null=True)


class RiskSampleBatchProcessSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        max_length=100,
        error_messages={'min_length': '至少选择一条记录', 'max_length': '最多处理100条记录'}
    )
    action = serializers.ChoiceField(choices=['confirm', 'resolve', 'mark_false_positive'])
    handle_comment = serializers.CharField(required=False, allow_blank=True, max_length=2000)


class RiskRuleSerializer(serializers.ModelSerializer):
    rule_type_display = serializers.CharField(source='get_rule_type_display', read_only=True)
    risk_level_display = serializers.CharField(source='get_risk_level_display', read_only=True)

    class Meta:
        model = RiskRule
        fields = [
            'id', 'name', 'rule_type', 'rule_type_display', 'pattern',
            'risk_level', 'risk_level_display', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
