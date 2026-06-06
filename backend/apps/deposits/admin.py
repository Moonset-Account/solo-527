from django.contrib import admin
from .models import Deposit, DepositTransaction, DepositAppeal


@admin.register(Deposit)
class DepositAdmin(admin.ModelAdmin):
    list_display = ['family', 'balance', 'frozen_amount', 'total_balance', 'status', 'last_transaction_at']
    list_filter = ['status']
    search_fields = ['family__name']


@admin.register(DepositTransaction)
class DepositTransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'deposit', 'transaction_type', 'amount', 'balance_after', 'frozen_after', 'operator', 'needs_confirmation', 'confirmed_at', 'created_at']
    list_filter = ['transaction_type', 'needs_confirmation']
    search_fields = ['deposit__family__name', 'description']


@admin.register(DepositAppeal)
class DepositAppealAdmin(admin.ModelAdmin):
    list_display = ['id', 'transaction', 'family', 'appellant', 'status', 'refund_amount', 'handler', 'created_at', 'handled_at']
    list_filter = ['status']
    search_fields = ['family__name', 'reason']
