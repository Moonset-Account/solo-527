from django.db import models
from django.conf import settings


class ProductionDataManager(models.Manager):
    def get_queryset(self):
        queryset = super().get_queryset()
        if settings.IS_PRODUCTION:
            return queryset.filter(is_test_data=False)
        return queryset


class TestDataManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_test_data=True)
