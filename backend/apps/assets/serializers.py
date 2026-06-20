from rest_framework import serializers
from .models import ServerAsset, AssetGroup
from apps.serializers import BaseModelSerializer


class ServerAssetSimpleSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ServerAsset
        fields = ['id', 'name', 'ip_address', 'hostname', 'status', 'status_display']


class ServerAssetSerializer(BaseModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    server_type_display = serializers.CharField(source='get_server_type_display', read_only=True)
    responsible_name = serializers.CharField(source='responsible.name', read_only=True)
    tag_list = serializers.ListField(read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = ServerAsset
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'name', 'hostname', 'ip_address', 'ip_internal',
            'server_type', 'server_type_display', 'os_type', 'os_version',
            'cpu_cores', 'memory_gb', 'disk_gb', 'cpu_usage', 'memory_usage',
            'disk_usage', 'status', 'status_display', 'location', 'idc',
            'cabinet', 'responsible', 'responsible_name', 'tags', 'tag_list',
            'description', 'is_active', 'last_check_time'
        ]


class AssetGroupSerializer(BaseModelSerializer):
    server_count = serializers.IntegerField(read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = AssetGroup
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'name', 'code', 'parent', 'description', 'sort_order', 'server_count'
        ]


class AssetGroupDetailSerializer(BaseModelSerializer):
    servers = ServerAssetSimpleSerializer(many=True, read_only=True)
    children = AssetGroupSerializer(many=True, read_only=True)

    class Meta(BaseModelSerializer.Meta):
        model = AssetGroup
        fields = BaseModelSerializer.Meta.fields + [
            'id', 'name', 'code', 'parent', 'servers', 'children',
            'description', 'sort_order'
        ]
