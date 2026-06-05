from django.contrib import admin
from .models import EquipmentCategory, Equipment, EquipmentUsageLog


@admin.register(EquipmentCategory)
class EquipmentCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'requires_training', 'is_dangerous', 'sort_order')
    list_filter = ('requires_training', 'is_dangerous')
    search_fields = ('name', 'description')
    ordering = ('sort_order', 'name')


class EquipmentUsageLogInline(admin.TabularInline):
    model = EquipmentUsageLog
    extra = 0
    readonly_fields = ('start_time', 'end_time', 'user', 'notes')
    can_delete = False


@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'status', 'location', 'usage_count', 'is_available')
    list_filter = ('status', 'category', 'location')
    search_fields = ('name', 'model_number', 'serial_number', 'location')
    readonly_fields = ('usage_count',)
    fieldsets = (
        ('基本信息', {'fields': ('name', 'category', 'image', 'qr_code')}),
        ('设备详情', {'fields': ('model_number', 'serial_number', 'location', 'description', 'specifications')}),
        ('状态', {'fields': ('status', 'usage_count')}),
        ('配置', {'fields': ('max_booking_hours', 'require_approval')}),
        ('维护', {'fields': ('purchase_date', 'last_maintenance_date', 'next_maintenance_date')}),
        ('元数据', {'fields': ('created_at', 'updated_at', 'created_by', 'updated_by')}),
    )
    readonly_fields = ('created_at', 'updated_at')
    inlines = [EquipmentUsageLogInline]


@admin.register(EquipmentUsageLog)
class EquipmentUsageLogAdmin(admin.ModelAdmin):
    list_display = ('equipment', 'user', 'start_time', 'end_time')
    list_filter = ('equipment', 'user', 'start_time')
    search_fields = ('equipment__name', 'user__real_name', 'notes')
    date_hierarchy = 'start_time'
    readonly_fields = ('created_at', 'updated_at')
