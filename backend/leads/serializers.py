from rest_framework import serializers
from .models import LeadSource, LeadStatus, Customer, Lead, FollowupRecord, TimeoutRecord


class LeadSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadSource
        fields = ['id', 'name', 'description', 'is_active', 'sort_order', 'created_at', 'updated_at']


class LeadStatusSerializer(serializers.ModelSerializer):
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)

    class Meta:
        model = LeadStatus
        fields = ['id', 'name', 'stage', 'stage_display', 'description', 'sort_order', 'is_active', 'created_at']


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'name', 'phone', 'email', 'gender', 'age',
            'address', 'wechat', 'avatar', 'notes', 'created_by',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class CustomerSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'gender', 'age']


class LeadSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    source_name = serializers.CharField(source='source.name', read_only=True)
    status_name = serializers.CharField(source='status.name', read_only=True)
    status_stage = serializers.CharField(source='status.stage', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    consultant_name = serializers.CharField(source='consultant.full_name', read_only=True)
    quality_display = serializers.CharField(source='get_quality_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    followup_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'customer', 'customer_name', 'customer_phone',
            'source', 'source_name', 'status', 'status_name', 'status_stage',
            'quality', 'quality_display', 'quality_score',
            'assigned_to', 'assigned_to_name', 'consultant', 'consultant_name',
            'expected_amount', 'actual_amount', 'dental_issues', 'treatment_plan',
            'budget', 'urgency', 'is_public_sea',
            'last_followup_at', 'next_followup_at', 'followup_count',
            'is_timeout', 'timeout_reason', 'response_node',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'quality_score', 'quality']

    def create(self, validated_data):
        lead = Lead(**validated_data)
        lead.calculate_quality_score()
        if not lead.assigned_to:
            lead.assigned_to = self.context['request'].user
        lead.save()
        return lead

    def update(self, instance, validated_data):
        old_status = instance.status
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.calculate_quality_score()
        instance.save()
        return instance


class LeadDetailSerializer(LeadSerializer):
    customer = CustomerSerializer(read_only=True)
    followups = serializers.SerializerMethodField()

    class Meta(LeadSerializer.Meta):
        fields = LeadSerializer.Meta.fields + ['customer', 'followups']

    def get_followups(self, obj):
        followups = obj.followups.all()[:10]
        return FollowupRecordSerializer(followups, many=True).data


class FollowupRecordSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    followup_type_display = serializers.CharField(source='get_followup_type_display', read_only=True)
    result_display = serializers.CharField(source='get_result_display', read_only=True)

    class Meta:
        model = FollowupRecord
        fields = [
            'id', 'lead', 'followup_type', 'followup_type_display',
            'result', 'result_display', 'content', 'next_followup_at',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def create(self, validated_data):
        followup = FollowupRecord(**validated_data)
        followup.created_by = self.context['request'].user
        followup.save()
        lead = followup.lead
        lead.last_followup_at = followup.created_at
        lead.next_followup_at = followup.next_followup_at
        lead.followup_count += 1
        lead.is_timeout = False
        lead.save()
        return followup


class TimeoutRecordSerializer(serializers.ModelSerializer):
    lead_id = serializers.IntegerField(source='lead.id', read_only=True)
    responsible_person_name = serializers.CharField(source='responsible_person.full_name', read_only=True)
    handled_by_name = serializers.CharField(source='handled_by.full_name', read_only=True)

    class Meta:
        model = TimeoutRecord
        fields = [
            'id', 'lead_id', 'timeout_type', 'timeout_duration', 'reason',
            'responsible_person', 'responsible_person_name',
            'handled_at', 'handled_by', 'handled_by_name',
            'is_handled', 'created_at'
        ]
        read_only_fields = ['created_at']
