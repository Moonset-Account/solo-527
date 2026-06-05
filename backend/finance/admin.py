from django.contrib import admin
from .models import FeeItem, Payment, LeaveRequest


@admin.register(FeeItem)
class FeeItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'fee_type', 'amount', 'due_date', 'is_active']
    list_filter = ['fee_type', 'is_active']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['child', 'fee_item', 'amount', 'status', 'due_date', 'paid_at']
    list_filter = ['status']


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ['child', 'requester', 'start_date', 'end_date', 'status', 'reviewed_by']
    list_filter = ['status']
