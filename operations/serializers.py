from rest_framework import serializers
from operations.models import Wastage, Stocktake, Inventory, MaterialUse, Sale

class WastageSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='store.name', read_only=True)
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_code = serializers.CharField(source='material.code', read_only=True)
    is_trial = serializers.BooleanField(source='material.is_trial', read_only=True)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    shift_display = serializers.CharField(source='get_shift_display', read_only=True)
    
    class Meta:
        model = Wastage
        fields = ['id', 'store', 'store_name', 'material', 'material_name', 'material_code', 
                  'quantity', 'unit_price', 'total_amount', 'reason', 'reason_display',
                  'shift', 'shift_display', 'record_date', 'is_trial', 'remark']

class StocktakeSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='store.name', read_only=True)
    material_name = serializers.CharField(source='material.name', read_only=True)
    is_trial = serializers.BooleanField(source='material.is_trial', read_only=True)
    shift_display = serializers.CharField(source='get_shift_display', read_only=True)
    
    class Meta:
        model = Stocktake
        fields = ['id', 'store', 'store_name', 'material', 'material_name',
                  'system_quantity', 'actual_quantity', 'diff_quantity', 'diff_amount',
                  'shift', 'shift_display', 'record_date', 'is_trial']

class InventorySerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='store.name', read_only=True)
    material_name = serializers.CharField(source='material.name', read_only=True)
    
    class Meta:
        model = Inventory
        fields = ['id', 'store', 'store_name', 'material', 'material_name',
                  'quantity', 'unit_price', 'total_amount', 'record_date', 'batch_no']

class MaterialUseSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='store.name', read_only=True)
    material_name = serializers.CharField(source='material.name', read_only=True)
    shift_display = serializers.CharField(source='get_shift_display', read_only=True)
    
    class Meta:
        model = MaterialUse
        fields = ['id', 'store', 'store_name', 'material', 'material_name',
                  'quantity', 'shift', 'shift_display', 'record_date']

class SaleSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='store.name', read_only=True)
    material_name = serializers.CharField(source='material.name', read_only=True)
    shift_display = serializers.CharField(source='get_shift_display', read_only=True)
    
    class Meta:
        model = Sale
        fields = ['id', 'store', 'store_name', 'product_name', 'material', 'material_name',
                  'quantity', 'material_consume', 'sale_amount', 'shift', 'shift_display', 'sale_date']
