from rest_framework import serializers
from .models import FrameworkContract, ContractPrice, PriceHistory, ContractRenewal


class ContractPriceSerializer(serializers.ModelSerializer):
    specification_name = serializers.CharField(source='specification.name', read_only=True)
    specification_spec = serializers.CharField(source='specification.specification', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = ContractPrice
        fields = [
            'id', 'contract', 'specification', 'specification_name', 'specification_spec',
            'unit_price', 'minimum_quantity', 'discount_rate', 'effective_date',
            'expiration_date', 'is_active', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class FrameworkContractSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    project_manager_name = serializers.CharField(source='project_manager.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_terms_display = serializers.CharField(source='get_payment_terms_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    category_names = serializers.SerializerMethodField()
    prices = ContractPriceSerializer(many=True, read_only=True)
    days_to_expiry = serializers.SerializerMethodField()
    contract_file_url = serializers.SerializerMethodField()

    class Meta:
        model = FrameworkContract
        fields = [
            'id', 'contract_number', 'title', 'supplier', 'supplier_name',
            'project_manager', 'project_manager_name', 'start_date', 'end_date',
            'total_amount', 'minimum_order_amount', 'payment_terms', 'payment_terms_display',
            'status', 'status_display', 'categories', 'category_names', 'specifications',
            'terms_and_conditions', 'delivery_terms', 'quality_requirements',
            'penalty_clause', 'contract_file', 'contract_file_url', 'signed_date',
            'signing_location', 'prices', 'days_to_expiry',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_category_names(self, obj):
        return list(obj.categories.values_list('name', flat=True))

    def get_days_to_expiry(self, obj):
        from datetime import date
        if obj.end_date:
            return (obj.end_date - date.today()).days
        return None

    def get_contract_file_url(self, obj):
        request = self.context.get('request')
        if obj.contract_file and request:
            return request.build_absolute_uri(obj.contract_file.url)
        return obj.contract_file.url if obj.contract_file else None


class PriceHistorySerializer(serializers.ModelSerializer):
    specification_name = serializers.CharField(source='specification.name', read_only=True)
    specification_spec = serializers.CharField(source='specification.specification', read_only=True)
    contract_number = serializers.CharField(source='contract.contract_number', read_only=True, allow_null=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)

    class Meta:
        model = PriceHistory
        fields = [
            'id', 'specification', 'specification_name', 'specification_spec',
            'contract', 'contract_number', 'unit_price', 'price_date',
            'source', 'change_reason', 'recorded_by', 'recorded_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'recorded_by']


class ContractRenewalSerializer(serializers.ModelSerializer):
    original_contract_number = serializers.CharField(source='original_contract.contract_number', read_only=True)
    original_contract_title = serializers.CharField(source='original_contract.title', read_only=True)
    new_contract_number = serializers.CharField(source='new_contract.contract_number', read_only=True, allow_null=True)
    decision_display = serializers.CharField(source='get_decision_display', read_only=True)
    handled_by_name = serializers.CharField(source='handled_by.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = ContractRenewal
        fields = [
            'id', 'original_contract', 'original_contract_number', 'original_contract_title',
            'new_contract', 'new_contract_number', 'renewal_recommendation',
            'decision', 'decision_display', 'decision_reason',
            'handled_by', 'handled_by_name', 'handled_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'handled_by']
