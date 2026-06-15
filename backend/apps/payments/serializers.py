from rest_framework import serializers
from django.utils import timezone
from .models import PaymentOrder, PaymentTransaction, CashierShift


def generate_order_no():
    now = timezone.now()
    return f'ORD{now.strftime("%Y%m%d%H%M%S")}{now.microsecond // 1000:03d}'


def generate_transaction_no():
    now = timezone.now()
    return f'TXN{now.strftime("%Y%m%d%H%M%S")}{now.microsecond // 1000:03d}'


def generate_shift_no():
    now = timezone.now()
    return f'SFT{now.strftime("%Y%m%d%H%M%S")}{now.microsecond // 1000:03d}'


class PaymentOrderSerializer(serializers.ModelSerializer):
    member_username = serializers.CharField(source='member.username', read_only=True)
    cashier_username = serializers.CharField(source='cashier.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    order_type_display = serializers.CharField(source='get_order_type_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    discrepancy_resolved_by_username = serializers.CharField(
        source='discrepancy_resolved_by.username', read_only=True
    )

    class Meta:
        model = PaymentOrder
        fields = [
            'id', 'order_no', 'order_type', 'order_type_display',
            'member', 'member_username', 'total_amount', 'discount_amount',
            'points_deduction', 'balance_deduction', 'payable_amount',
            'paid_amount', 'refund_amount', 'payment_method', 'payment_method_display',
            'status', 'status_display', 'transaction_id', 'paid_at',
            'cashier', 'cashier_username', 'has_discrepancy', 'discrepancy_note',
            'discrepancy_resolved', 'discrepancy_resolved_at',
            'discrepancy_resolved_by', 'discrepancy_resolved_by_username',
            'notes', 'is_demo', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'order_no', 'paid_amount', 'refund_amount', 'status', 'paid_at',
            'cashier', 'discrepancy_resolved', 'discrepancy_resolved_at',
            'discrepancy_resolved_by', 'is_demo', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'is_demo': {'read_only': True}
        }

    def create(self, validated_data):
        if 'order_no' not in validated_data or not validated_data['order_no']:
            validated_data['order_no'] = generate_order_no()
        validated_data['payable_amount'] = (
            validated_data['total_amount']
            - validated_data.get('discount_amount', 0)
            - validated_data.get('points_deduction', 0)
            - validated_data.get('balance_deduction', 0)
        )
        validated_data['cashier'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'total_amount' in validated_data:
            total = validated_data['total_amount']
            discount = validated_data.get('discount_amount', instance.discount_amount)
            points = validated_data.get('points_deduction', instance.points_deduction)
            balance = validated_data.get('balance_deduction', instance.balance_deduction)
            validated_data['payable_amount'] = total - discount - points - balance
        return super().update(instance, validated_data)


class PaymentOrderListSerializer(serializers.ModelSerializer):
    member_username = serializers.CharField(source='member.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    order_type_display = serializers.CharField(source='get_order_type_display', read_only=True)

    class Meta:
        model = PaymentOrder
        fields = [
            'id', 'order_no', 'order_type', 'order_type_display',
            'member_username', 'total_amount', 'payable_amount', 'paid_amount',
            'status', 'status_display', 'has_discrepancy', 'discrepancy_resolved',
            'created_at'
        ]


class PaymentTransactionSerializer(serializers.ModelSerializer):
    order_no = serializers.CharField(source='order.order_no', read_only=True)
    operator_username = serializers.CharField(source='operator.username', read_only=True)
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PaymentTransaction
        fields = [
            'id', 'order', 'order_no', 'transaction_no', 'transaction_type',
            'transaction_type_display', 'amount', 'payment_method',
            'payment_method_display', 'third_party_transaction_id', 'status',
            'status_display', 'operator', 'operator_username', 'remark',
            'is_demo', 'created_at'
        ]
        read_only_fields = ['transaction_no', 'is_demo', 'created_at']
        extra_kwargs = {
            'is_demo': {'read_only': True}
        }

    def create(self, validated_data):
        if 'transaction_no' not in validated_data or not validated_data['transaction_no']:
            validated_data['transaction_no'] = generate_transaction_no()
        validated_data['operator'] = self.context['request'].user
        return super().create(validated_data)


class CashierShiftSerializer(serializers.ModelSerializer):
    cashier_username = serializers.CharField(source='cashier.username', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = CashierShift
        fields = [
            'id', 'shift_no', 'cashier', 'cashier_username', 'start_time',
            'end_time', 'opening_cash', 'expected_cash', 'actual_cash',
            'cash_discrepancy', 'status', 'status_display', 'orders_count',
            'total_amount', 'reconciliation_note', 'is_demo', 'created_at'
        ]
        read_only_fields = [
            'shift_no', 'cashier', 'start_time', 'end_time', 'expected_cash',
            'cash_discrepancy', 'status', 'orders_count', 'total_amount',
            'is_demo', 'created_at'
        ]
        extra_kwargs = {
            'is_demo': {'read_only': True}
        }

    def create(self, validated_data):
        if 'shift_no' not in validated_data or not validated_data['shift_no']:
            validated_data['shift_no'] = generate_shift_no()
        validated_data['cashier'] = self.context['request'].user
        validated_data['start_time'] = timezone.now()
        validated_data['status'] = 'open'
        return super().create(validated_data)


class DiscrepancySerializer(serializers.Serializer):
    discrepancy_note = serializers.CharField(required=True, max_length=500)


class DiscrepancyResolveSerializer(serializers.Serializer):
    resolution_note = serializers.CharField(required=True, max_length=500)


class PaymentProcessSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(
        choices=PaymentOrder.PAYMENT_METHOD_CHOICES,
        required=True
    )
    paid_amount = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=True
    )
    transaction_id = serializers.CharField(required=False, max_length=100)


class ShiftCloseSerializer(serializers.Serializer):
    actual_cash = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)


class ShiftReconcileSerializer(serializers.Serializer):
    reconciliation_note = serializers.CharField(required=True, max_length=500)
