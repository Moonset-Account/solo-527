import django_filters
from .models import ChangeWindow


class ChangeWindowFilter(django_filters.FilterSet):
    start_from = django_filters.DateTimeFilter(field_name='start_time', lookup_expr='gte')
    start_to = django_filters.DateTimeFilter(field_name='start_time', lookup_expr='lte')
    end_from = django_filters.DateTimeFilter(field_name='end_time', lookup_expr='gte')
    end_to = django_filters.DateTimeFilter(field_name='end_time', lookup_expr='lte')

    class Meta:
        model = ChangeWindow
        fields = ['status', 'change_type', 'applicant', 'approver', 'executor']
