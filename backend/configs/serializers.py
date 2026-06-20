from rest_framework import serializers
from .models import InvoiceConfig, PrepaidConfig, CashForecastConfig, ConfigChangelog


class InvoiceConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceConfig
        fields = '__all__'
        read_only_fields = ['updated_by', 'updated_at']


class PrepaidConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrepaidConfig
        fields = '__all__'
        read_only_fields = ['updated_by', 'updated_at']


class CashForecastConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = CashForecastConfig
        fields = '__all__'
        read_only_fields = ['updated_by', 'updated_at']


class ConfigChangelogSerializer(serializers.ModelSerializer):
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = ConfigChangelog
        fields = '__all__'

    def get_changed_by_name(self, obj):
        return obj.changed_by.get_full_name() or obj.changed_by.username
