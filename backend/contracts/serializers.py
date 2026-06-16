from rest_framework import serializers
from .models import (
    Contract, ReviewWorkflow, ReviewStep, ContractReview,
    ReviewOpinion, StampNode, EvidenceChecklist, EvidenceMaterial,
    ProgressRecord, RejectionNotification,
)
from django.contrib.auth.models import User


class UserBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']


class ContractSerializer(serializers.ModelSerializer):
    uploader_name = serializers.CharField(source='uploader.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Contract
        fields = [
            'id', 'title', 'contract_number', 'file', 'counterparty',
            'contract_type', 'amount', 'status', 'status_display',
            'uploader', 'uploader_name', 'description', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'uploader', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['uploader'] = self.context['request'].user
        return super().create(validated_data)


class ContractListSerializer(serializers.ModelSerializer):
    uploader_name = serializers.CharField(source='uploader.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Contract
        fields = [
            'id', 'title', 'contract_number', 'counterparty',
            'contract_type', 'amount', 'status', 'status_display',
            'uploader_name', 'created_at',
        ]


class ReviewStepSerializer(serializers.ModelSerializer):
    result_display = serializers.CharField(source='get_result_display', read_only=True, default='')

    class Meta:
        model = ReviewStep
        fields = ['id', 'workflow', 'order', 'name', 'reviewer_role', 'is_required']


class ReviewWorkflowSerializer(serializers.ModelSerializer):
    steps = ReviewStepSerializer(many=True, read_only=True)
    step_count = serializers.IntegerField(source='steps.count', read_only=True)

    class Meta:
        model = ReviewWorkflow
        fields = ['id', 'name', 'description', 'contract_type', 'is_active', 'steps', 'step_count', 'created_at']


class ReviewWorkflowCreateSerializer(serializers.ModelSerializer):
    steps = ReviewStepSerializer(many=True, required=False)

    class Meta:
        model = ReviewWorkflow
        fields = ['id', 'name', 'description', 'contract_type', 'is_active', 'steps']

    def create(self, validated_data):
        steps_data = validated_data.pop('steps', [])
        workflow = ReviewWorkflow.objects.create(**validated_data)
        for step_data in steps_data:
            ReviewStep.objects.create(workflow=workflow, **step_data)
        return workflow


class ReviewOpinionSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source='reviewer.get_full_name', read_only=True)
    result_display = serializers.CharField(source='get_result_display', read_only=True)
    step_name = serializers.CharField(source='step.name', read_only=True)

    class Meta:
        model = ReviewOpinion
        fields = [
            'id', 'contract_review', 'step', 'step_name', 'reviewer',
            'reviewer_name', 'opinion', 'result', 'result_display', 'reviewed_at',
        ]
        read_only_fields = ['reviewer', 'reviewed_at']

    def create(self, validated_data):
        validated_data['reviewer'] = self.context['request'].user
        return super().create(validated_data)


class StampNodeSerializer(serializers.ModelSerializer):
    handler_name = serializers.CharField(source='handler.get_full_name', read_only=True, default='')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = StampNode
        fields = [
            'id', 'business_form', 'stamp_type', 'handler', 'handler_name',
            'handled_at', 'status', 'status_display', 'remark', 'created_at',
        ]


class EvidenceMaterialSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True, default='')

    class Meta:
        model = EvidenceMaterial
        fields = [
            'id', 'checklist', 'business_form', 'file', 'uploaded_by',
            'uploaded_by_name', 'description', 'created_at',
        ]
        read_only_fields = ['uploaded_by']

    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        return super().create(validated_data)


class EvidenceChecklistSerializer(serializers.ModelSerializer):
    materials = EvidenceMaterialSerializer(many=True, read_only=True)
    collector_name = serializers.CharField(source='collector.get_full_name', read_only=True, default='')
    material_count = serializers.IntegerField(source='materials.count', read_only=True, default=0)

    class Meta:
        model = EvidenceChecklist
        fields = [
            'id', 'business_form', 'item_name', 'is_required', 'is_collected',
            'collector', 'collector_name', 'collected_at', 'materials', 'material_count',
        ]


class ProgressRecordSerializer(serializers.ModelSerializer):
    handler_name = serializers.CharField(source='handler.get_full_name', read_only=True, default='')
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)

    class Meta:
        model = ProgressRecord
        fields = [
            'id', 'business_form', 'stage', 'stage_display', 'handler',
            'handler_name', 'action', 'remark', 'created_at',
        ]


class ContractReviewDetailSerializer(serializers.ModelSerializer):
    opinions = ReviewOpinionSerializer(many=True, read_only=True)
    stamp_nodes = StampNodeSerializer(many=True, read_only=True)
    evidence_checklists = EvidenceChecklistSerializer(many=True, read_only=True)
    evidence_materials = EvidenceMaterialSerializer(many=True, read_only=True)
    progress_records = ProgressRecordSerializer(many=True, read_only=True)
    contract_title = serializers.CharField(source='contract.title', read_only=True)
    contract_number = serializers.CharField(source='contract.contract_number', read_only=True)
    workflow_name = serializers.CharField(source='workflow.name', read_only=True)
    current_step_name = serializers.CharField(source='current_step.name', read_only=True, default='')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ContractReview
        fields = [
            'id', 'contract', 'contract_title', 'contract_number',
            'workflow', 'workflow_name', 'current_step', 'current_step_name',
            'status', 'status_display', 'started_at', 'completed_at',
            'opinions', 'stamp_nodes', 'evidence_checklists',
            'evidence_materials', 'progress_records',
            'created_at', 'updated_at',
        ]


class ContractReviewListSerializer(serializers.ModelSerializer):
    contract_title = serializers.CharField(source='contract.title', read_only=True)
    contract_number = serializers.CharField(source='contract.contract_number', read_only=True)
    workflow_name = serializers.CharField(source='workflow.name', read_only=True)
    current_step_name = serializers.CharField(source='current_step.name', read_only=True, default='')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ContractReview
        fields = [
            'id', 'contract', 'contract_title', 'contract_number',
            'workflow', 'workflow_name', 'current_step', 'current_step_name',
            'status', 'status_display', 'started_at', 'completed_at',
        ]


class ContractReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractReview
        fields = ['contract', 'workflow']


class RejectionNotificationSerializer(serializers.ModelSerializer):
    rejected_by_name = serializers.CharField(source='rejected_by.get_full_name', read_only=True)
    compliance_manager_name = serializers.CharField(source='compliance_manager.get_full_name', read_only=True)
    contract_number = serializers.CharField(source='contract_review.contract.contract_number', read_only=True)
    contract_title = serializers.CharField(source='contract_review.contract.title', read_only=True)

    class Meta:
        model = RejectionNotification
        fields = [
            'id', 'contract_review', 'contract_number', 'contract_title',
            'rejected_by', 'rejected_by_name', 'compliance_manager',
            'compliance_manager_name', 'reason', 'is_read',
            'synced_to_board', 'created_at',
        ]


class ReviewEfficiencySerializer(serializers.Serializer):
    reviewer_id = serializers.IntegerField()
    reviewer_name = serializers.CharField()
    total_reviews = serializers.IntegerField()
    passed_reviews = serializers.IntegerField()
    rejected_reviews = serializers.IntegerField()
    avg_review_hours = serializers.FloatField()
    completion_rate = serializers.FloatField()
