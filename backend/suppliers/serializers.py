from rest_framework import serializers
from .models import Supplier, SupplierRisk, SupplierRiskEvidence, SupplierEvaluation


class SupplierSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    credit_rating_display = serializers.CharField(source='get_credit_rating_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    current_risk_level = serializers.SerializerMethodField()
    active_risk_count = serializers.SerializerMethodField()

    class Meta:
        model = Supplier
        fields = [
            'id', 'name', 'unified_social_credit_code', 'legal_person', 'contact_person',
            'contact_phone', 'contact_email', 'address', 'registered_capital',
            'establishment_date', 'business_scope', 'status', 'status_display',
            'credit_rating', 'credit_rating_display', 'bank_account', 'bank_name',
            'tax_number', 'current_risk_level', 'active_risk_count',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_current_risk_level(self, obj):
        return obj.get_current_risk_level()

    def get_active_risk_count(self, obj):
        return obj.risks.filter(status__in=['open', 'monitoring']).count()


class SupplierRiskEvidenceSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = SupplierRiskEvidence
        fields = ['id', 'file', 'file_url', 'file_name', 'description', 'uploaded_by', 'uploaded_by_name', 'created_at']
        read_only_fields = ['id', 'created_at', 'uploaded_by']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None


class SupplierRiskSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    risk_type_display = serializers.CharField(source='get_risk_type_display', read_only=True)
    risk_level_display = serializers.CharField(source='get_risk_level_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    identified_by_name = serializers.CharField(source='identified_by.get_full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True, allow_null=True)
    evidences = SupplierRiskEvidenceSerializer(many=True, read_only=True)

    class Meta:
        model = SupplierRisk
        fields = [
            'id', 'supplier', 'supplier_name', 'risk_type', 'risk_type_display',
            'risk_level', 'risk_level_display', 'title', 'description', 'source',
            'discovered_date', 'expected_resolution_date', 'actual_resolution_date',
            'status', 'status_display', 'mitigation_measures', 'identified_by',
            'identified_by_name', 'assigned_to', 'assigned_to_name', 'evidences',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'identified_by']


class SupplierEvaluationSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    evaluated_by_name = serializers.CharField(source='evaluated_by.get_full_name', read_only=True)

    class Meta:
        model = SupplierEvaluation
        fields = [
            'id', 'supplier', 'supplier_name', 'evaluation_period', 'quality_score',
            'delivery_score', 'price_score', 'service_score', 'overall_score',
            'comments', 'evaluated_by', 'evaluated_by_name', 'evaluation_date', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'evaluation_date', 'evaluated_by']
