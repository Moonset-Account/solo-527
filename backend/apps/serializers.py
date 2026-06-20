from rest_framework import serializers


COMMON_FIELDS = ['created_by_name', 'updated_by_name', 'created_at', 'updated_at']


class BaseModelSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.name', read_only=True, allow_null=True, default='')
    updated_by_name = serializers.CharField(source='updated_by.name', read_only=True, allow_null=True, default='')
    created_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)
    updated_at = serializers.DateTimeField(format='%Y-%m-%d %H:%M:%S', read_only=True)

    class Meta:
        fields = COMMON_FIELDS
