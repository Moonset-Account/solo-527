from django.contrib import admin
from .models import ConsumableCategory, Consumable, ConsumableUsage, ConsumableRestock


@admin.register(ConsumableCategory)
class ConsumableCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'sort_order')
    search_fields = ('name', 'description')
    ordering = ('sort_order', 'name')


class ConsumableUsageInline(admin.TabularInline):
    model = ConsumableUsage
    extra = 0
    readonly_fields = ('quantity', 'unit_price_at_usage', 'total_cost', 'user', 'is_billed', 'created_at')
    can_delete = False


class ConsumableRestockInline(admin.TabularInline):
    model = ConsumableRestock
    extra = 0
    readonly_fields = ('quantity', 'unit_cost', 'total_cost', 'supplier', 'batch_number', 'created_at')
    can_delete = False


@admin.register(Consumable)
class ConsumableAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'sku', 'unit', 'unit_price', 'current_stock', 'min_stock', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'sku', 'description')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('基本信息', {'fields': ('name', 'category', 'sku', 'image')}),
        ('详情', {'fields': ('description', 'specifications', 'unit', 'unit_price', 'location')}),
        ('库存', {'fields': ('current_stock', 'min_stock', 'max_stock')}),
        ('状态', {'fields': ('is_active',)}),
        ('元数据', {'fields': ('created_at', 'updated_at', 'created_by', 'updated_by')}),
    )
    inlines = [ConsumableUsageInline, ConsumableRestockInline]


@admin.register(ConsumableUsage)
class ConsumableUsageAdmin(admin.ModelAdmin):
    list_display = ('consumable', 'user', 'quantity', 'total_cost', 'is_billed', 'created_at')
    list_filter = ('is_billed', 'created_at')
    search_fields = ('consumable__name', 'user__real_name', 'notes')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at', 'billed_at')


@admin.register(ConsumableRestock)
class ConsumableRestockAdmin(admin.ModelAdmin):
    list_display = ('consumable', 'quantity', 'unit_cost', 'total_cost', 'supplier', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('consumable__name', 'supplier', 'batch_number')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
