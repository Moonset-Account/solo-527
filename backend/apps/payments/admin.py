from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import PaymentOrder, PaymentTransaction, CashierShift


class PaymentTransactionInline(admin.TabularInline):
    model = PaymentTransaction
    extra = 0
    fields = ['transaction_no', 'transaction_type', 'amount', 'payment_method', 'status', 'operator', 'created_at']
    readonly_fields = ['created_at']
    raw_id_fields = ['operator']


@admin.register(PaymentOrder)
class PaymentOrderAdmin(admin.ModelAdmin):
    list_display = ['order_no', 'get_order_type_display', 'member', 'total_amount', 'discount_amount', 'payable_amount', 'paid_amount', 'get_payment_method_display', 'get_status_display', 'paid_at', 'cashier', 'has_discrepancy', 'discrepancy_resolved', 'is_demo', 'created_at']
    list_filter = ['order_type', 'payment_method', 'status', 'has_discrepancy', 'discrepancy_resolved', 'is_demo', 'created_at', 'paid_at']
    search_fields = ['order_no', 'member__username', 'member__phone', 'transaction_id']
    ordering = ['-created_at']
    raw_id_fields = ['member', 'cashier', 'discrepancy_resolved_by']
    inlines = [PaymentTransactionInline]
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        (_('基本信息'), {'fields': ('order_no', 'order_type')}),
        (_('用户信息'), {'fields': ('member',)}),
        (_('金额信息'), {'fields': ('total_amount', 'discount_amount', 'points_deduction', 'balance_deduction', 'payable_amount', 'paid_amount', 'refund_amount')}),
        (_('支付信息'), {'fields': ('payment_method', 'status', 'transaction_id', 'paid_at')}),
        (_('收银信息'), {'fields': ('cashier',)}),
        (_('差异信息'), {'fields': ('has_discrepancy', 'discrepancy_note', 'discrepancy_resolved', 'discrepancy_resolved_at', 'discrepancy_resolved_by')}),
        (_('备注信息'), {'fields': ('notes',)}),
        (_('系统信息'), {'fields': ('is_demo', 'created_at', 'updated_at')}),
    )


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ['transaction_no', 'order', 'get_transaction_type_display', 'amount', 'get_payment_method_display', 'get_status_display', 'operator', 'created_at']
    list_filter = ['transaction_type', 'payment_method', 'status', 'created_at']
    search_fields = ['transaction_no', 'third_party_transaction_id', 'order__order_no']
    ordering = ['-created_at']
    raw_id_fields = ['order', 'operator']
    readonly_fields = ['created_at']
    fieldsets = (
        (_('基本信息'), {'fields': ('transaction_no', 'transaction_type')}),
        (_('关联信息'), {'fields': ('order',)}),
        (_('交易信息'), {'fields': ('amount', 'payment_method', 'third_party_transaction_id', 'status')}),
        (_('操作信息'), {'fields': ('operator', 'remark')}),
        (_('系统信息'), {'fields': ('is_demo', 'created_at')}),
    )


@admin.register(CashierShift)
class CashierShiftAdmin(admin.ModelAdmin):
    list_display = ['shift_no', 'cashier', 'start_time', 'end_time', 'opening_cash', 'expected_cash', 'actual_cash', 'cash_discrepancy', 'get_status_display', 'orders_count', 'total_amount', 'is_demo', 'created_at']
    list_filter = ['status', 'is_demo', 'created_at', 'start_time', 'end_time']
    search_fields = ['shift_no', 'cashier__username', 'cashier__phone']
    ordering = ['-start_time']
    raw_id_fields = ['cashier']
    readonly_fields = ['created_at']
    fieldsets = (
        (_('基本信息'), {'fields': ('shift_no', 'cashier')}),
        (_('时间信息'), {'fields': ('start_time', 'end_time')}),
        (_('现金信息'), {'fields': ('opening_cash', 'expected_cash', 'actual_cash', 'cash_discrepancy')}),
        (_('状态信息'), {'fields': ('status', 'orders_count', 'total_amount')}),
        (_('对账信息'), {'fields': ('reconciliation_note',)}),
        (_('系统信息'), {'fields': ('is_demo', 'created_at')}),
    )
