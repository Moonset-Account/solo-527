from rest_framework import serializers
from django.conf import settings


class ProductionDataSerializerMixin:
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if settings.IS_PRODUCTION and instance.is_test_data:
            return None
        return data
