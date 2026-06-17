from django.contrib import admin
from .models import Material, MaterialUsage, MaterialPurchase, MaterialPurchaseItem, MaterialList, MaterialListItem


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'category', 'unit', 'unit_price', 'stock_quantity', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('code', 'name', 'specification')


@admin.register(MaterialUsage)
class MaterialUsageAdmin(admin.ModelAdmin):
    list_display = ('project', 'material', 'quantity', 'total_amount', 'status', 'requested_by', 'created_at')
    list_filter = ('status', 'created_at')


@admin.register(MaterialPurchase)
class MaterialPurchaseAdmin(admin.ModelAdmin):
    list_display = ('supplier', 'total_amount', 'purchase_date', 'created_at')
    list_filter = ('purchase_date',)
    date_hierarchy = 'purchase_date'


@admin.register(MaterialList)
class MaterialListAdmin(admin.ModelAdmin):
    list_display = ('project', 'name', 'total_amount', 'is_approved', 'created_at')
    list_filter = ('is_approved',)
