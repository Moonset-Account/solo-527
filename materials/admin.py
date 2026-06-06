from django.contrib import admin
from .models import MaterialCategory, Material, TrialProduct

@admin.register(MaterialCategory)
class MaterialCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'sort_order']
    list_filter = ['parent']
    search_fields = ['name']

@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'category', 'unit', 'unit_price', 'is_trial']
    list_filter = ['category', 'is_trial']
    search_fields = ['code', 'name']

@admin.register(TrialProduct)
class TrialProductAdmin(admin.ModelAdmin):
    list_display = ['material', 'start_date', 'end_date', 'remark']
    list_filter = ['start_date']
    search_fields = ['material__name']
