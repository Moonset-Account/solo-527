from rest_framework import serializers
from .models import PaymentItem, Invoice, PaymentRecord
from apps.children.serializers import ChildSerializer


class PaymentItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentItem
        fields = ['id', 'name', 'description', 'default_amount', 'is_active']


class PaymentRecordSerializer(serializers.ModelSerializer):
    paid_by_name = serializers.CharField(source='paid_by.name', read_only=True)

    class Meta:
        model = PaymentRecord
        fields = ['id', 'invoice', 'amount', 'payment_method', 'transaction_id',
                  'paid_at', 'paid_by', 'paid_by_name', 'notes']
        read_only_fields = ['paid_at', 'paid_by']


class InvoiceSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    remaining_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    payment_records = PaymentRecordSerializer(many=True, read_only=True)
    paid_by_name = serializers.CharField(source='paid_by.name', read_only=True)

    class Meta:
        model = Invoice
        fields = ['id', 'child', 'child_name', 'item', 'item_name', 'amount',
                  'paid_amount', 'remaining_amount', 'status', 'status_display',
                  'bill_date', 'due_date', 'paid_at', 'paid_by', 'paid_by_name',
                  'payment_method', 'notes', 'reminder_sent', 'last_reminder_at',
                  'payment_records']
        read_only_fields = ['paid_at', 'paid_by', 'paid_amount', 'reminder_sent', 'last_reminder_at']
