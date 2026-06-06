from rest_framework import serializers
from materials.models import MaterialCategory, Material, TrialProduct

class MaterialCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialCategory
        fields = ['id', 'name', 'parent', 'sort_order']

class MaterialSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Material
        fields = ['id', 'code', 'name', 'category', 'category_name', 'unit', 'unit_price', 'is_trial']

class TrialProductSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    
    class Meta:
        model = TrialProduct
        fields = ['id', 'material', 'material_name', 'start_date', 'end_date', 'store_ids', 'remark']
