from rest_framework import serializers
from .models import Material, MaterialUsage, MaterialPurchase, MaterialPurchaseItem, MaterialList, MaterialListItem


class MaterialSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Material
        fields = ['id', 'code', 'name', 'category', 'category_display', 'specification',
                  'brand', 'unit', 'unit_price', 'stock_quantity', 'description', 'is_active',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class MaterialUsageSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_code = serializers.CharField(source='material.code', read_only=True)
    project_code = serializers.CharField(source='project.code', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)

    class Meta:
        model = MaterialUsage
        fields = ['id', 'project', 'project_code', 'project_name', 'material', 'material_code',
                  'material_name', 'quantity', 'unit_price', 'total_amount', 'purpose',
                  'status', 'status_display', 'requested_by', 'requested_by_name',
                  'approved_by', 'approved_by_name', 'approved_at',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'total_amount', 'approved_at', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['total_amount'] = validated_data['quantity'] * validated_data.get('unit_price', 0)
        return super().create(validated_data)


class MaterialPurchaseItemSerializer(serializers.ModelSerializer):
    material_code = serializers.CharField(source='material.code', read_only=True)
    material_name = serializers.CharField(source='material.name', read_only=True)

    class Meta:
        model = MaterialPurchaseItem
        fields = ['id', 'material', 'material_code', 'material_name', 'quantity',
                  'unit_price', 'total_amount']
        read_only_fields = ['id', 'total_amount']

    def create(self, validated_data):
        validated_data['total_amount'] = validated_data['quantity'] * validated_data['unit_price']
        return super().create(validated_data)


class MaterialPurchaseSerializer(serializers.ModelSerializer):
    items = MaterialPurchaseItemSerializer(many=True, read_only=True)
    project_code = serializers.CharField(source='project.code', read_only=True, allow_null=True)
    project_name = serializers.CharField(source='project.name', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = MaterialPurchase
        fields = ['id', 'project', 'project_code', 'project_name', 'supplier', 'invoice_no',
                  'total_amount', 'purchase_date', 'remark', 'items',
                  'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'total_amount', 'created_at']


class MaterialListItemSerializer(serializers.ModelSerializer):
    material_code = serializers.CharField(source='material.code', read_only=True, allow_null=True)

    class Meta:
        model = MaterialListItem
        fields = ['id', 'material', 'material_code', 'material_name', 'specification',
                  'unit', 'quantity', 'unit_price', 'total_amount', 'remark', 'sort_order']
        read_only_fields = ['id', 'total_amount']

    def create(self, validated_data):
        validated_data['total_amount'] = validated_data['quantity'] * validated_data.get('unit_price', 0)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        quantity = validated_data.get('quantity', instance.quantity)
        unit_price = validated_data.get('unit_price', instance.unit_price)
        validated_data['total_amount'] = quantity * unit_price
        return super().update(instance, validated_data)


class MaterialListSerializer(serializers.ModelSerializer):
    project_code = serializers.CharField(source='project.code', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = MaterialList
        fields = ['id', 'project', 'project_code', 'project_name', 'name', 'description',
                  'total_amount', 'is_approved', 'approved_by', 'approved_by_name',
                  'approved_at', 'created_by', 'created_by_name', 'item_count',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'total_amount', 'approved_at', 'created_at', 'updated_at']


class MaterialListDetailSerializer(MaterialListSerializer):
    items = MaterialListItemSerializer(many=True, read_only=True)

    class Meta(MaterialListSerializer.Meta):
        fields = MaterialListSerializer.Meta.fields + ['items']
