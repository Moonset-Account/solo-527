from django.db.models import Count
from .models import ServerAsset, AssetGroup
from .serializers import (
    ServerAssetSerializer, ServerAssetSimpleSerializer,
    AssetGroupSerializer, AssetGroupDetailSerializer
)
from .filters import ServerAssetFilter
from apps.viewsets import OrganizationScopedViewSet


class ServerAssetViewSet(OrganizationScopedViewSet):
    queryset = ServerAsset.objects.all()
    serializer_class = ServerAssetSerializer
    filterset_class = ServerAssetFilter
    search_fields = ['name', 'hostname', 'ip_address', 'ip_internal', 'tags']
    ordering_fields = [
        'name', 'ip_address', 'status', 'cpu_usage', 'memory_usage',
        'disk_usage', 'created_at', 'last_check_time'
    ]


class AssetGroupViewSet(OrganizationScopedViewSet):
    queryset = AssetGroup.objects.all()
    filterset_fields = ['parent']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'sort_order', 'created_at']

    def get_queryset(self):
        qs = super().get_queryset().annotate(server_count=Count('servers'))
        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AssetGroupDetailSerializer
        return AssetGroupSerializer
