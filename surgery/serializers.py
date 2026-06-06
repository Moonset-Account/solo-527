from rest_framework import serializers
from .models import (
    SurgicalTemplate, TemplateSupplyItem, OperationSchedule,
    PreparedItem, UsageRecord, ReturnRecord, HighValueAudit
)
from inventory.serializers import SupplySerializer, BatchSerializer


class TemplateSupplyItemSerializer(serializers.ModelSerializer):
    supply_detail = SupplySerializer(source='supply', read_only=True)

    class Meta:
        model = TemplateSupplyItem
        fields = '__all__'


class SurgicalTemplateSerializer(serializers.ModelSerializer):
    supply_items = TemplateSupplyItemSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = SurgicalTemplate
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class PreparedItemSerializer(serializers.ModelSerializer):
    supply_detail = SupplySerializer(source='supply', read_only=True)
    batch_detail = BatchSerializer(source='batch', read_only=True)
    prepared_by_name = serializers.CharField(source='prepared_by.username', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.username', read_only=True, allow_null=True)

    class Meta:
        model = PreparedItem
        fields = '__all__'
        read_only_fields = ('prepared_at', 'verified_at')


class OperationScheduleSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    nurse_name = serializers.CharField(source='nurse.username', read_only=True)
    original_template_name = serializers.CharField(source='original_template.name', read_only=True, allow_null=True)
    prepared_items = PreparedItemSerializer(many=True, read_only=True)
    has_template_changed = serializers.BooleanField(read_only=True)

    class Meta:
        model = OperationSchedule
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'has_template_changed')

    def get_has_template_changed(self, obj):
        return obj.original_template is not None


class UsageRecordSerializer(serializers.ModelSerializer):
    supply_name = serializers.CharField(source='supply.name', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True)
    used_by_name = serializers.CharField(source='used_by.username', read_only=True)
    confirmed_by_name = serializers.CharField(source='confirmed_by.username', read_only=True, allow_null=True)
    patient_name = serializers.CharField(source='schedule.patient_name', read_only=True)

    class Meta:
        model = UsageRecord
        fields = '__all__'
        read_only_fields = ('scan_time', 'confirm_time', 'is_scan_created', 'is_high_value')


class ReturnRecordSerializer(serializers.ModelSerializer):
    supply_name = serializers.CharField(source='supply.name', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True)
    returned_by_name = serializers.CharField(source='returned_by.username', read_only=True)
    confirmed_by_name = serializers.CharField(source='confirmed_by.username', read_only=True, allow_null=True)
    patient_name = serializers.CharField(source='schedule.patient_name', read_only=True)

    class Meta:
        model = ReturnRecord
        fields = '__all__'
        read_only_fields = ('return_time', 'confirm_time')


class HighValueAuditSerializer(serializers.ModelSerializer):
    supply_name = serializers.CharField(source='supply.name', read_only=True)
    supply_code = serializers.CharField(source='supply.code', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True)
    operator_name = serializers.CharField(source='operator.username', read_only=True)
    auditor_name = serializers.CharField(source='auditor.username', read_only=True, allow_null=True)
    patient_name = serializers.CharField(source='schedule.patient_name', read_only=True)

    class Meta:
        model = HighValueAudit
        fields = '__all__'
        read_only_fields = ('action_time', 'audit_time')
