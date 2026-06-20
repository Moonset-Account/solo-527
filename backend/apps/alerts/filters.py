import django_filters
from .models import Alert


class AlertFilter(django_filters.FilterSet):
    occurred_from = django_filters.DateTimeFilter(field_name='occurred_at', lookup_expr='gte')
    occurred_to = django_filters.DateTimeFilter(field_name='occurred_at', lookup_expr='lte')
    created_from = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_to = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Alert
        fields = [
            'source', 'level', 'status', 'server',
            'change_window', 'category', 'handler',
            'acknowledged_by', 'processed_by', 'closed_by'
        ]
