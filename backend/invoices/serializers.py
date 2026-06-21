from rest_framework import serializers
from .models import Invoice, InvoiceItem, InvoiceStatusLog


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = [
            'id', 'invoice', 'item_name', 'specification', 'unit',
            'quantity', 'unit_price', 'amount', 'tax_rate', 'tax_amount'
        ]
        read_only_fields = ['id']


class InvoiceStatusLogSerializer(serializers.ModelSerializer):
    operated_by_name = serializers.CharField(source='operated_by.get_full_name', read_only=True)
    from_status_display = serializers.SerializerMethodField()
    to_status_display = serializers.SerializerMethodField()

    class Meta:
        model = InvoiceStatusLog
        fields = [
            'id', 'invoice', 'from_status', 'from_status_display',
            'to_status', 'to_status_display', 'remark', 'operated_by',
            'operated_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'operated_by']

    def get_from_status_display(self, obj):
        return dict(Invoice.STATUS_CHOICES).get(obj.from_status, obj.from_status) if obj.from_status else ''

    def get_to_status_display(self, obj):
        return dict(Invoice.STATUS_CHOICES).get(obj.to_status, obj.to_status)


class InvoiceSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    contract_number = serializers.CharField(source='contract.contract_number', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    invoice_type_display = serializers.CharField(source='get_invoice_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True, allow_null=True)
    paid_by_name = serializers.CharField(source='paid_by.get_full_name', read_only=True, allow_null=True)
    items = InvoiceItemSerializer(many=True, read_only=True)
    status_logs = InvoiceStatusLogSerializer(many=True, read_only=True)
    invoice_file_url = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'invoice_number', 'invoice_code', 'invoice_type', 'invoice_type_display',
            'invoice_date', 'supplier', 'supplier_name', 'contract', 'contract_number',
            'total_amount', 'tax_amount', 'tax_rate', 'status', 'status_display',
            'due_date', 'actual_payment_date', 'payment_method',
            'invoice_file', 'invoice_file_url', 'remarks',
            'created_by', 'created_by_name', 'reviewed_by', 'reviewed_by_name',
            'paid_by', 'paid_by_name', 'items', 'status_logs',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_invoice_file_url(self, obj):
        request = self.context.get('request')
        if obj.invoice_file and request:
            return request.build_absolute_uri(obj.invoice_file.url)
        return obj.invoice_file.url if obj.invoice_file else None


class InvoiceCreateSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, write_only=True)

    class Meta:
        model = Invoice
        fields = [
            'invoice_number', 'invoice_code', 'invoice_type', 'invoice_date',
            'supplier', 'contract', 'total_amount', 'tax_amount', 'tax_rate',
            'due_date', 'payment_method', 'invoice_file', 'remarks', 'items'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        user = self.context['request'].user
        invoice = Invoice.objects.create(created_by=user, **validated_data)
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        InvoiceStatusLog.objects.create(
            invoice=invoice,
            to_status=invoice.status,
            remark='创建发票',
            operated_by=user
        )
        return invoice
