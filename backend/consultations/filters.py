from django_filters import rest_framework as filters
from .models import ConsultationRecord


class ConsultationFilter(filters.FilterSet):
    created_at_start = filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    created_at_end = filters.DateFilter(field_name='created_at', lookup_expr='date__lte')

    class Meta:
        model = ConsultationRecord
        fields = [
            'customer', 'consultation_type', 'intention_level',
            'consultation_doctor', 'consultant', 'lead'
        ]
