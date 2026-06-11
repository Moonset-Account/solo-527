from rest_framework import serializers
from .models import Prompt, PromptCategory, PromptTemplate


class PromptCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PromptCategory
        fields = ['id', 'name', 'description', 'parent', 'sort_order', 'created_at']
        read_only_fields = ['id', 'created_at']


class PromptVersionSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Prompt
        fields = [
            'id', 'title', 'version', 'status', 'author_name',
            'is_current_version', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PromptListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)

    class Meta:
        model = Prompt
        fields = [
            'id', 'title', 'description', 'category', 'category_name',
            'author', 'author_name', 'status', 'version',
            'is_current_version', 'gray_scale_percent',
            'accuracy_rate', 'usage_count', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'author', 'is_current_version',
            'accuracy_rate', 'usage_count', 'created_at', 'updated_at'
        ]


class PromptDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    author_name = serializers.CharField(source='author.username', read_only=True)
    versions = PromptVersionSerializer(many=True, read_only=True)

    class Meta:
        model = Prompt
        fields = [
            'id', 'title', 'content', 'description', 'category', 'category_name',
            'author', 'author_name', 'status', 'version', 'parent_prompt',
            'is_current_version', 'gray_scale_percent',
            'target_sales_operations', 'accuracy_rate', 'usage_count',
            'variables', 'versions', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'author', 'is_current_version',
            'accuracy_rate', 'usage_count', 'created_at', 'updated_at', 'versions'
        ]


class PromptCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prompt
        fields = [
            'title', 'content', 'description', 'category',
            'gray_scale_percent', 'target_sales_operations', 'variables',
            'parent_prompt'
        ]

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class PromptUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prompt
        fields = [
            'title', 'content', 'description', 'category',
            'gray_scale_percent', 'target_sales_operations', 'variables'
        ]


class PromptTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromptTemplate
        fields = ['id', 'name', 'template', 'placeholders', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
