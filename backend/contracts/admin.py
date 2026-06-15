from django.contrib import admin
from .models import ContractStatus, Contract, ContractItem, ContractAttachment, ApprovalRecord, PaymentRecord


@admin.register(ContractStatus)
class ContractStatusAdmin(admin.ModelAdmin):
    list_display = ['name', 'sort_order', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ['contract_no', 'customer', 'contract_type', 'status', 'approval_status', 'payment_status', 'total_amount', 'actual_amount', 'sales_person', 'created_at']
    list_filter = ['contract_type', 'status', 'approval_status', 'payment_status']
    search_fields = ['contract_no', 'customer__name', 'customer__phone']
    raw_id_fields = ['customer', 'lead', 'consultation', 'sales_person', 'doctor', 'created_by', 'approved_by']
    ordering = ['-created_at']


@admin.register(ContractItem)
class ContractItemAdmin(admin.ModelAdmin):
    list_display = ['item_name', 'contract', 'quantity', 'unit_price', 'discount', 'subtotal']
    search_fields = ['item_name']
    raw_id_fields = ['contract']


@admin.register(ContractAttachment)
class ContractAttachmentAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'contract', 'uploaded_by', 'created_at']
    search_fields = ['file_name']
    raw_id_fields = ['contract', 'uploaded_by']


@admin.register(ApprovalRecord)
class ApprovalRecordAdmin(admin.ModelAdmin):
    list_display = ['contract', 'action', 'approved_by', 'created_at']
    list_filter = ['action']
    raw_id_fields = ['contract', 'approved_by']


@admin.register(PaymentRecord)
class PaymentRecordAdmin(admin.ModelAdmin):
    list_display = ['contract', 'amount', 'payment_method', 'payment_date', 'created_by']
    list_filter = ['payment_method']
    search_fields = ['receipt_no']
    raw_id_fields = ['contract', 'created_by']
