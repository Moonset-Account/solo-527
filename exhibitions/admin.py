from django.contrib import admin
from .models import (
    ExhibitionHall, Exhibition, BorrowOrder, BorrowItem,
    ApprovalRecord, TransportRecord
)


class BorrowItemInline(admin.TabularInline):
    model = BorrowItem
    extra = 0
    readonly_fields = ['pickup_time', 'return_time']


class ApprovalRecordInline(admin.TabularInline):
    model = ApprovalRecord
    extra = 0
    readonly_fields = ['created_at']


class TransportRecordInline(admin.TabularInline):
    model = TransportRecord
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ExhibitionHall)
class ExhibitionHallAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'floor', 'area', 'is_active']
    list_filter = ['is_active', 'floor']
    search_fields = ['name', 'code']


@admin.register(Exhibition)
class ExhibitionAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'hall', 'curator', 'status', 'start_date', 'end_date']
    list_filter = ['status', 'hall', 'start_date', 'end_date']
    search_fields = ['name', 'code', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(BorrowOrder)
class BorrowOrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_no', 'exhibition', 'hall', 'type', 'status',
        'requester', 'expected_pickup_date', 'expected_return_date',
        'is_cross_hall', 'requires_approval'
    ]
    list_filter = ['status', 'type', 'is_cross_hall', 'requires_approval', 'expected_pickup_date']
    search_fields = ['order_no', 'exhibition__name', 'requester__username']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [BorrowItemInline, ApprovalRecordInline, TransportRecordInline]


@admin.register(BorrowItem)
class BorrowItemAdmin(admin.ModelAdmin):
    list_display = [
        'borrow_order', 'material', 'quantity', 'picked_up_quantity',
        'returned_quantity', 'status'
    ]
    list_filter = ['status', 'material__type', 'material__category']
    search_fields = ['borrow_order__order_no', 'material__name', 'material__code']
    readonly_fields = ['pickup_time', 'return_time']


@admin.register(ApprovalRecord)
class ApprovalRecordAdmin(admin.ModelAdmin):
    list_display = ['borrow_order', 'approver', 'action', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['borrow_order__order_no', 'approver__username']
    readonly_fields = ['created_at']


@admin.register(TransportRecord)
class TransportRecordAdmin(admin.ModelAdmin):
    list_display = [
        'borrow_order', 'tracking_no', 'status',
        'from_location', 'to_location', 'estimated_departure', 'estimated_arrival'
    ]
    list_filter = ['status', 'estimated_departure', 'estimated_arrival']
    search_fields = ['tracking_no', 'borrow_order__order_no']
    readonly_fields = ['created_at', 'updated_at']
