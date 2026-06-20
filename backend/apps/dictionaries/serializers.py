from rest_framework import serializers
from .models import DictionaryCategory, DictionaryItem
from apps.serializers import BaseModelSerializer


class DictionaryItemSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DictionaryItem
        fields = ['id', 'code', 'name', 'value', 'sort_order', 'is_default', 'is_active']


class DictionaryCategorySerializer(BaseModelSerializer):
    item_count = serializers.IntegerField(read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = DictionaryCategory
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'code', 'name', 'description', 'item_count'
        ]


class DictionaryCategoryDetailSerializer(BaseModelSerializer):
    items = DictionaryItemSimpleSerializer(many=True, read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = DictionaryCategory
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'code', 'name', 'description', 'items'
        ]


class DictionaryItemSerializer(BaseModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = DictionaryItem
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'category', 'category_name', 'code', 'name', 'value',
            'sort_order', 'is_default', 'is_active', 'parent'
        ]
