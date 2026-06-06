from django.contrib import admin
from .models import MaterialCategory, Material, Warehouse, InventoryItem, InventoryReservation


@admin.register(MaterialCategory)
class MaterialCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'parent']
    list_filter = ['parent']
    search_fields = ['name', 'code']


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'type', 'category', 'is_valuable', 'requires_double_confirm']
    list_filter = ['type', 'category', 'is_valuable', 'requires_double_confirm']
    search_fields = ['name', 'code', 'specification']


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'location', 'manager']
    search_fields = ['name', 'code']


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ['material', 'serial_number', 'warehouse', 'status']
    list_filter = ['status', 'warehouse', 'material__type', 'material__category']
    search_fields = ['serial_number', 'material__name', 'material__code']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(InventoryReservation)
class InventoryReservationAdmin(admin.ModelAdmin):
    list_display = ['inventory_item', 'exhibition', 'status', 'start_date', 'end_date', 'requested_by']
    list_filter = ['status', 'start_date', 'end_date']
    search_fields = ['inventory_item__serial_number', 'exhibition__name']
    readonly_fields = ['created_at', 'updated_at']
