from rest_framework import serializers
from .models import Quotation, QuotationItem, QuotationExtra


class QuotationItemSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = QuotationItem
        fields = ['id', 'category', 'category_display', 'name', 'specification',
                  'unit', 'quantity', 'unit_price', 'amount', 'remark', 'sort_order']
        read_only_fields = ['id', 'amount']

    def create(self, validated_data):
        validated_data['amount'] = validated_data['quantity'] * validated_data.get('unit_price', 0)
        return super().create(validated_data)


class QuotationExtraSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    confirmed_by_name = serializers.CharField(source='confirmed_by.get_full_name', read_only=True)

    class Meta:
        model = QuotationExtra
        fields = ['id', 'name', 'description', 'reason', 'amount', 'is_confirmed',
                  'confirmed_by', 'confirmed_by_name', 'confirmed_at',
                  'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'confirmed_at', 'created_at']


class QuotationSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    project_code = serializers.CharField(source='project.code', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    confirmed_by_name = serializers.CharField(source='confirmed_by.get_full_name', read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    extra_count = serializers.IntegerField(read_only=True)
    extra_total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = Quotation
        fields = ['id', 'project', 'project_code', 'project_name', 'version', 'title',
                  'valid_days', 'expire_date', 'material_cost', 'labor_cost',
                  'equipment_cost', 'management_fee', 'profit', 'tax', 'discount',
                  'total_amount', 'status', 'status_display', 'is_current', 'remark',
                  'terms', 'created_by', 'created_by_name', 'confirmed_by',
                  'confirmed_by_name', 'confirmed_at', 'client_confirm_signature',
                  'item_count', 'extra_count', 'extra_total', 'created_at', 'updated_at']
        read_only_fields = ['id', 'total_amount', 'confirmed_at', 'created_at', 'updated_at']


class QuotationDetailSerializer(QuotationSerializer):
    items = QuotationItemSerializer(many=True, read_only=True)
    extras = QuotationExtraSerializer(many=True, read_only=True)

    class Meta(QuotationSerializer.Meta):
        fields = QuotationSerializer.Meta.fields + ['items', 'extras']
