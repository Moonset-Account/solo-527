from rest_framework import serializers
from .models import SupplyCategory, Supply, Batch, ScanRecord, StockWarning


class SupplyCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SupplyCategory
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class SupplySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    total_stock = serializers.IntegerField(read_only=True)

    class Meta:
        model = Supply
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'total_stock')


class BatchSerializer(serializers.ModelSerializer):
    supply_name = serializers.CharField(source='supply.name', read_only=True)
    supply_code = serializers.CharField(source='supply.code', read_only=True)
    days_to_expire = serializers.IntegerField(read_only=True)
    is_warning = serializers.BooleanField(read_only=True)

    class Meta:
        model = Batch
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'is_expired', 'days_to_expire', 'is_warning')


class ScanRecordSerializer(serializers.ModelSerializer):
    operator_name = serializers.CharField(source='operator.username', read_only=True)
    confirm_operator_name = serializers.CharField(source='confirm_operator.username', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True)
    supply_name = serializers.CharField(source='batch.supply.name', read_only=True)

    class Meta:
        model = ScanRecord
        fields = '__all__'
        read_only_fields = ('scan_time', 'confirm_time')


class StockWarningSerializer(serializers.ModelSerializer):
    supply_name = serializers.CharField(source='supply.name', read_only=True)
    batch_number = serializers.CharField(source='batch.batch_number', read_only=True, allow_null=True)
    handled_by_name = serializers.CharField(source='handled_by.username', read_only=True, allow_null=True)

    class Meta:
        model = StockWarning
        fields = '__all__'
        read_only_fields = ('created_at',)
