from rest_framework import serializers
from .models import DictionaryCategory, DictionaryItem
from apps.serializers import BaseModelSerializer


class DictionaryItemSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DictionaryItem
        fields = ['id', 'code', 'name', 'value', 'sort_order', 'is_default', 'is_active']


class DictionaryCategorySerializer(BaseModelSerializer):
    item_count = serializers.IntegerField(read_only=True)
    items_count = serializers.IntegerField(read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = DictionaryCategory
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'code', 'name', 'description',
            'is_active', 'is_enabled',
            'item_count', 'items_count'
        ]


class DictionaryCategoryDetailSerializer(BaseModelSerializer):
    items = DictionaryItemSimpleSerializer(many=True, read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = DictionaryCategory
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'code', 'name', 'description',
            'is_active', 'is_enabled',
            'items'
        ]


class DictionaryItemSerializer(BaseModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = DictionaryItem
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'category', 'category_name', 'code', 'name', 'value',
            'sort_order', 'is_default', 'is_active', 'is_enabled',
            'description', 'parent'
        ]
