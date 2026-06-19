from django_filters import rest_framework as filters
from django.conf import settings


class ProductionDataFilter(filters.FilterSet):
    is_test_data = filters.BooleanFilter(method='filter_test_data')

    def filter_test_data(self, queryset, name, value):
        if settings.IS_PRODUCTION:
            return queryset.filter(is_test_data=False)
        if value is not None:
            return queryset.filter(is_test_data=value)
        return queryset
