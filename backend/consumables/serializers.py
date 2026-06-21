from rest_framework import serializers
from .models import (
    ConsumableCategory, ConsumableSpecification, SpecificationAttachment, MonthlyUsage
)


class ConsumableCategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    parent_name = serializers.CharField(source='parent.name', read_only=True)

    class Meta:
        model = ConsumableCategory
        fields = ['id', 'name', 'code', 'description', 'parent', 'parent_name', 'children', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_children(self, obj):
        if obj.children.exists():
            return ConsumableCategorySerializer(obj.children.all(), many=True).data
        return []


class SpecificationAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = SpecificationAttachment
        fields = ['id', 'file', 'file_url', 'file_name', 'file_type', 'file_size', 'uploaded_by', 'uploaded_by_name', 'created_at']
        read_only_fields = ['id', 'created_at', 'uploaded_by']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None


class ConsumableSpecificationSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_code = serializers.CharField(source='category.code', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    attachments = SpecificationAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = ConsumableSpecification
        fields = [
            'id', 'category', 'category_name', 'category_code', 'name', 'specification',
            'brand', 'unit', 'unit_display', 'unit_price', 'status', 'status_display',
            'description', 'created_by', 'created_by_name', 'attachments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class MonthlyUsageSerializer(serializers.ModelSerializer):
    specification_name = serializers.CharField(source='specification.name', read_only=True)
    specification_spec = serializers.CharField(source='specification.specification', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)

    class Meta:
        model = MonthlyUsage
        fields = [
            'id', 'specification', 'specification_name', 'specification_spec',
            'year', 'month', 'quantity', 'actual_amount', 'department',
            'recorded_by', 'recorded_by_name', 'remarks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'recorded_by']


class MonthlyUsageBatchSerializer(serializers.Serializer):
    usages = MonthlyUsageSerializer(many=True)

    def create(self, validated_data):
        usages_data = validated_data.pop('usages')
        user = self.context['request'].user
        created_usages = []
        for usage_data in usages_data:
            usage_data['recorded_by'] = user
            usage = MonthlyUsage.objects.create(**usage_data)
            created_usages.append(usage)
        return created_usages
