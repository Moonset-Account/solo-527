import django_filters
from .models import ServerAsset, AssetGroup


class ServerAssetFilter(django_filters.FilterSet):
    min_cpu_usage = django_filters.NumberFilter(field_name='cpu_usage', lookup_expr='gte')
    max_cpu_usage = django_filters.NumberFilter(field_name='cpu_usage', lookup_expr='lte')
    min_memory_usage = django_filters.NumberFilter(field_name='memory_usage', lookup_expr='gte')
    max_memory_usage = django_filters.NumberFilter(field_name='memory_usage', lookup_expr='lte')
    min_disk_usage = django_filters.NumberFilter(field_name='disk_usage', lookup_expr='gte')
    max_disk_usage = django_filters.NumberFilter(field_name='disk_usage', lookup_expr='lte')
    groups = django_filters.ModelMultipleChoiceFilter(
        queryset=AssetGroup.objects.all(),
        field_name='groups',
        conjoined=False
    )

    class Meta:
        model = ServerAsset
        fields = ['status', 'server_type', 'is_active', 'responsible']
