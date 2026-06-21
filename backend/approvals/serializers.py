from rest_framework import serializers
from .models import (
    ApprovalLevel, ApprovalFlow, FlowLevelRelation, ApprovalRequest, ApprovalRecord
)


class ApprovalLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalLevel
        fields = ['id', 'name', 'level_order', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class FlowLevelRelationSerializer(serializers.ModelSerializer):
    level_name = serializers.CharField(source='level.name', read_only=True)
    required_approvers_info = serializers.SerializerMethodField()

    class Meta:
        model = FlowLevelRelation
        fields = [
            'id', 'flow', 'level', 'level_name', 'order', 'required_approvers', 'required_approvers_info', 'min_approvers']
        read_only_fields = ['id']

    def get_required_approvers_info(self, obj):
        from users.serializers import UserSerializer
        return UserSerializer(obj.required_approvers.all(), many=True).data


class ApprovalFlowSerializer(serializers.ModelSerializer):
    flow_type_display = serializers.CharField(source='get_flow_type_display', read_only=True)
    levels_with_order = serializers.SerializerMethodField()

    class Meta:
        model = ApprovalFlow
        fields = [
            'id', 'name', 'flow_type', 'flow_type_display',
            'levels_with_order', 'description', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_levels_with_order(self, obj):
        relations = FlowLevelRelation.objects.filter(flow=obj).order_by('order')
        return FlowLevelRelationSerializer(relations, many=True).data


class ApprovalRecordSerializer(serializers.ModelSerializer):
    approver_name = serializers.CharField(source='approver.get_full_name', read_only=True)
    level_name = serializers.CharField(source='level.name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    transferred_to_name = serializers.CharField(
        source='transferred_to.get_full_name', read_only=True, allow_null=True
    )

    class Meta:
        model = ApprovalRecord
        fields = [
            'id', 'request', 'level', 'level_name', 'approver', 'approver_name',
            'action', 'action_display', 'comment',
            'transferred_to', 'transferred_to_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ApprovalRequestSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    requester_name = serializers.CharField(source='requester.get_full_name', read_only=True)
    records = ApprovalRecordSerializer(many=True, read_only=True)
    current_level_info = serializers.SerializerMethodField()
    flow_type_display = serializers.CharField(source='get_flow_type_display', read_only=True)
    flow_type = serializers.CharField()

    class Meta:
        model = ApprovalRequest
        fields = [
            'id', 'flow_type', 'flow_type_display', 'title',
            'content_type', 'object_id', 'status',
            'status_display', 'current_level_order', 'current_level_info',
            'requester', 'requester_name', 'remarks', 'records',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'requester']

    def get_current_level_info(self, obj):
        try:
            flow = ApprovalFlow.objects.get(flow_type=obj.flow_type, is_active=True)
            relation = FlowLevelRelation.objects.get(flow=flow, order=obj.current_level_order)
            return {
                'level_id': relation.level.id,
                'level_name': relation.level.name,
                'approvers': [{'id': u.id, 'name': u.get_full_name()} for u in relation.required_approvers.all()]
            }
        except (ApprovalFlow.DoesNotExist, FlowLevelRelation.DoesNotExist):
            return None
