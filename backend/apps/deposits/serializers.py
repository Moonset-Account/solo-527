from rest_framework import serializers
from .models import Deposit, DepositTransaction, DepositAppeal, TransactionType, DepositAppealStatus


class DepositSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    total_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    family_name = serializers.CharField(source='family.name', read_only=True)
    
    class Meta:
        model = Deposit
        fields = '__all__'
        read_only_fields = ['id', 'balance', 'frozen_amount', 'total_deposited', 'total_deducted', 'last_transaction_at']


class DepositTransactionSerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    operator_name = serializers.CharField(source='operator.username', read_only=True)
    confirmed_by_name = serializers.CharField(source='confirmed_by.username', read_only=True)
    family_name = serializers.CharField(source='deposit.family.name', read_only=True)
    
    class Meta:
        model = DepositTransaction
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'balance_after', 'frozen_after']


class DepositRechargeSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    description = serializers.CharField(required=False, allow_blank=True)


class DepositDeductSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=0.01)
    description = serializers.CharField()
    require_confirmation = serializers.BooleanField(default=True)


class DepositConfirmSerializer(serializers.Serializer):
    pass


class DepositAppealSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    family_name = serializers.CharField(source='family.name', read_only=True)
    appellant_name = serializers.CharField(source='appellant.username', read_only=True)
    handler_name = serializers.CharField(source='handler.username', read_only=True)
    transaction_detail = DepositTransactionSerializer(source='transaction', read_only=True)
    
    class Meta:
        model = DepositAppeal
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'handled_at', 'refund_amount']


class DepositAppealCreateSerializer(serializers.Serializer):
    transaction_id = serializers.IntegerField()
    reason = serializers.CharField()
    evidence_images = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )


class DepositAppealHandleSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    notes = serializers.CharField(required=False, allow_blank=True)
    refund_amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
