from django_filters import rest_framework as filters
from .models import Contract


class ContractFilter(filters.FilterSet):
    created_at_start = filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    created_at_end = filters.DateFilter(field_name='created_at', lookup_expr='date__lte')
    signed_at_start = filters.DateFilter(field_name='signed_at', lookup_expr='date__gte')
    signed_at_end = filters.DateFilter(field_name='signed_at', lookup_expr='date__lte')
    min_total_amount = filters.NumberFilter(field_name='total_amount', lookup_expr='gte')
    max_total_amount = filters.NumberFilter(field_name='total_amount', lookup_expr='lte')

    class Meta:
        model = Contract
        fields = [
            'contract_type', 'status', 'payment_status',
            'approval_status', 'sales_person', 'doctor', 'customer'
        ]
