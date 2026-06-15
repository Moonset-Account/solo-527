from rest_framework import serializers
from .models import ContractStatus, Contract, ContractItem, ContractAttachment, ApprovalRecord, PaymentRecord


class ContractStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractStatus
        fields = ['id', 'name', 'description', 'sort_order', 'is_active', 'created_at']


class ContractItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractItem
        fields = [
            'id', 'contract', 'item_name', 'category', 'quantity',
            'unit_price', 'discount', 'subtotal', 'notes', 'created_at'
        ]
        read_only_fields = ['created_at']


class ContractAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)

    class Meta:
        model = ContractAttachment
        fields = [
            'id', 'contract', 'file', 'file_name', 'file_type',
            'description', 'uploaded_by', 'uploaded_by_name', 'created_at'
        ]
        read_only_fields = ['created_at']


class ApprovalRecordSerializer(serializers.ModelSerializer):
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = ApprovalRecord
        fields = [
            'id', 'contract', 'action', 'action_display', 'comments',
            'approved_by', 'approved_by_name', 'created_at'
        ]
        read_only_fields = ['created_at']


class PaymentRecordSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = PaymentRecord
        fields = [
            'id', 'contract', 'amount', 'payment_method', 'payment_method_display',
            'payment_date', 'receipt_no', 'notes',
            'created_by', 'created_by_name', 'created_at'
        ]
        read_only_fields = ['created_at']


class ContractSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    status_name = serializers.CharField(source='status.name', read_only=True)
    contract_type_display = serializers.CharField(source='get_contract_type_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    approval_status_display = serializers.CharField(source='get_approval_status_display', read_only=True)
    sales_person_name = serializers.CharField(source='sales_person.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.full_name', read_only=True)
    items_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Contract
        fields = [
            'id', 'lead', 'customer', 'customer_name', 'customer_phone',
            'consultation', 'contract_no', 'contract_type', 'contract_type_display',
            'status', 'status_name', 'payment_status', 'payment_status_display',
            'approval_status', 'approval_status_display',
            'total_amount', 'discount_amount', 'discount_percent',
            'actual_amount', 'paid_amount',
            'treatment_plan', 'treatment_cycle', 'warranty_info',
            'start_date', 'end_date', 'notes',
            'sales_person', 'sales_person_name',
            'doctor', 'doctor_name',
            'discount_reason', 'approved_by', 'approved_by_name',
            'approved_at', 'approval_comments', 'signed_at',
            'items_count', 'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'discount_amount', 'actual_amount']

    def create(self, validated_data):
        contract = Contract(**validated_data)
        contract.created_by = self.context['request'].user
        if not contract.contract_no:
            from datetime import datetime
            contract.contract_no = f"HT{datetime.now().strftime('%Y%m%d%H%M%S')}"
        if not contract.sales_person:
            contract.sales_person = self.context['request'].user
        contract.save()
        return contract


class ContractDetailSerializer(ContractSerializer):
    items = ContractItemSerializer(many=True, read_only=True)
    attachments = ContractAttachmentSerializer(many=True, read_only=True)
    approval_records = ApprovalRecordSerializer(many=True, read_only=True)
    payments = PaymentRecordSerializer(many=True, read_only=True)

    class Meta(ContractSerializer.Meta):
        fields = ContractSerializer.Meta.fields + ['items', 'attachments', 'approval_records', 'payments']
