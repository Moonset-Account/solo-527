from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import ServiceCategory, ServiceItem, TestDriveSlot, ServiceRecord


@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'sort_order', 'is_active', 'is_demo', 'created_at']
    list_filter = ['is_active', 'is_demo', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['sort_order', '-created_at']
    raw_id_fields = ['parent']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        (_('基本信息'), {'fields': ('name', 'description', 'parent')}),
        (_('状态信息'), {'fields': ('sort_order', 'is_active', 'is_demo')}),
        (_('系统信息'), {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(ServiceItem)
class ServiceItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'get_service_type_display', 'price', 'member_price', 'duration_minutes', 'sort_order', 'is_available', 'is_demo', 'created_at']
    list_filter = ['service_type', 'category', 'is_available', 'is_demo', 'created_at']
    search_fields = ['name', 'description', 'short_description']
    ordering = ['sort_order', '-created_at']
    raw_id_fields = ['category']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        (_('基本信息'), {'fields': ('name', 'description', 'short_description', 'images')}),
        (_('分类配置'), {'fields': ('category', 'service_type')}),
        (_('价格配置'), {'fields': ('price', 'member_price')}),
        (_('服务配置'), {'fields': ('duration_minutes',)}),
        (_('状态信息'), {'fields': ('is_available', 'sort_order', 'is_demo')}),
        (_('系统信息'), {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(TestDriveSlot)
class TestDriveSlotAdmin(admin.ModelAdmin):
    list_display = ['service_item', 'date', 'start_time', 'end_time', 'vehicle_model', 'location', 'max_bookings', 'current_bookings', 'get_status_display', 'is_demo', 'created_at']
    list_filter = ['status', 'date', 'is_demo', 'created_at']
    search_fields = ['vehicle_model', 'location', 'service_item__name']
    ordering = ['date', 'start_time']
    raw_id_fields = ['service_item']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        (_('基本信息'), {'fields': ('service_item', 'vehicle_model', 'location')}),
        (_('时间配置'), {'fields': ('date', 'start_time', 'end_time')}),
        (_('预约配置'), {'fields': ('max_bookings', 'current_bookings')}),
        (_('状态信息'), {'fields': ('status', 'is_demo')}),
        (_('系统信息'), {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(ServiceRecord)
class ServiceRecordAdmin(admin.ModelAdmin):
    list_display = ['service_item', 'member', 'vehicle', 'get_status_display', 'staff', 'start_time', 'end_time', 'amount', 'final_amount', 'is_demo', 'created_at']
    list_filter = ['status', 'created_at', 'start_time', 'end_time', 'is_demo']
    search_fields = ['member__username', 'member__phone', 'vehicle__plate_number', 'service_item__name']
    ordering = ['-created_at']
    raw_id_fields = ['member', 'vehicle', 'service_item', 'booking', 'staff']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        (_('关联信息'), {'fields': ('member', 'vehicle', 'service_item', 'booking', 'staff')}),
        (_('服务状态'), {'fields': ('status', 'start_time', 'end_time', 'actual_duration')}),
        (_('费用信息'), {'fields': ('amount', 'discount_amount', 'final_amount')}),
        (_('服务详情'), {'fields': ('remarks', 'check_items')}),
        (_('系统信息'), {'fields': ('is_demo', 'created_at', 'updated_at')}),
    )
