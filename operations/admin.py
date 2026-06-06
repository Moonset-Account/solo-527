from django.contrib import admin
from .models import Inventory, MaterialUse, Wastage, Stocktake, Sale

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    list_display = ['store', 'material', 'quantity', 'unit_price', 'total_amount', 'record_date']
    list_filter = ['store', 'record_date']
    search_fields = ['material__name', 'batch_no']
    date_hierarchy = 'record_date'

@admin.register(MaterialUse)
class MaterialUseAdmin(admin.ModelAdmin):
    list_display = ['store', 'material', 'quantity', 'shift', 'record_date']
    list_filter = ['store', 'shift', 'record_date']
    search_fields = ['material__name']
    date_hierarchy = 'record_date'

@admin.register(Wastage)
class WastageAdmin(admin.ModelAdmin):
    list_display = ['store', 'material', 'quantity', 'total_amount', 'reason', 'shift', 'record_date']
    list_filter = ['store', 'reason', 'shift', 'record_date']
    search_fields = ['material__name']
    date_hierarchy = 'record_date'

@admin.register(Stocktake)
class StocktakeAdmin(admin.ModelAdmin):
    list_display = ['store', 'material', 'system_quantity', 'actual_quantity', 'diff_quantity', 'diff_amount', 'record_date']
    list_filter = ['store', 'shift', 'record_date']
    search_fields = ['material__name']
    date_hierarchy = 'record_date'

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ['store', 'product_name', 'quantity', 'material_consume', 'sale_amount', 'shift', 'sale_date']
    list_filter = ['store', 'shift', 'sale_date']
    search_fields = ['product_name']
    date_hierarchy = 'sale_date'
