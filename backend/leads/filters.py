from django_filters import rest_framework as filters
from .models import Lead, FollowupRecord, TimeoutRecord


class LeadFilter(filters.FilterSet):
    created_at_start = filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    created_at_end = filters.DateFilter(field_name='created_at', lookup_expr='date__lte')
    min_expected_amount = filters.NumberFilter(field_name='expected_amount', lookup_expr='gte')
    max_expected_amount = filters.NumberFilter(field_name='expected_amount', lookup_expr='lte')

    class Meta:
        model = Lead
        fields = [
            'source', 'status', 'quality', 'assigned_to', 'consultant',
            'is_public_sea', 'is_timeout', 'response_node'
        ]
