from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import SupplyCategory, Supply, Batch, ScanRecord, StockWarning


@admin.register(SupplyCategory)
class SupplyCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'created_at')
    search_fields = ('name',)


@admin.register(Supply)
class SupplyAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'category', 'supply_type', 'specification', 'unit', 'price', 'total_stock', 'warning_threshold', 'is_active')
    list_filter = ('supply_type', 'category', 'is_active')
    search_fields = ('name', 'code', 'specification')
    readonly_fields = ('total_stock',)

    def total_stock(self, obj):
        return obj.total_stock
    total_stock.short_description = '库存总量'


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ('supply', 'batch_number', 'production_date', 'expiry_date', 'quantity', 'storage_location', 'is_expired', 'expiry_status', 'days_to_expire_display')
    list_filter = ('is_expired', 'supply__supply_type', 'supply__category')
    search_fields = ('batch_number', 'supply__name', 'supply__code')
    readonly_fields = ('is_expired',)

    def expiry_status(self, obj):
        if obj.is_expired:
            return format_html('<span style="color: red; font-weight: bold;">已过期</span>')
        elif obj.is_warning:
            return format_html('<span style="color: orange; font-weight: bold;">即将过期</span>')
        else:
            return format_html('<span style="color: green;">正常</span>')
    expiry_status.short_description = '有效期状态'

    def days_to_expire_display(self, obj):
        if obj.is_expired:
            return '已过期'
        return f'{obj.days_to_expire}天'
    days_to_expire_display.short_description = '距过期天数'

    actions = ['check_expired']

    def check_expired(self, request, queryset):
        count = 0
        for batch in queryset:
            if batch.check_expired():
                count += 1
        self.message_user(request, f'已检查 {queryset.count()} 个批号，其中 {count} 个已过期')
    check_expired.short_description = '检查并标记过期批号'


@admin.register(ScanRecord)
class ScanRecordAdmin(admin.ModelAdmin):
    list_display = ('scan_type', 'batch', 'quantity', 'operator', 'is_double_confirmed', 'confirm_operator', 'scan_time')
    list_filter = ('scan_type', 'is_double_confirmed')
    search_fields = ('batch__batch_number', 'operator__username', 'confirm_operator__username')
    readonly_fields = ('scan_time', 'confirm_time')


@admin.register(StockWarning)
class StockWarningAdmin(admin.ModelAdmin):
    list_display = ('warning_type', 'warning_level', 'supply', 'batch', 'message', 'is_handled', 'created_at')
    list_filter = ('warning_type', 'warning_level', 'is_handled')
    search_fields = ('supply__name', 'message')
    readonly_fields = ('created_at',)

    actions = ['mark_handled']

    def mark_handled(self, request, queryset):
        updated = queryset.update(is_handled=True, handled_by=request.user, handled_at=timezone.now())
        self.message_user(request, f'已将 {updated} 条预警标记为已处理')
    mark_handled.short_description = '标记为已处理'
