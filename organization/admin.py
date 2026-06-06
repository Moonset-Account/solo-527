from django.contrib import admin
from .models import Region, Store

@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'created_at']
    search_fields = ['code', 'name']

@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'region', 'is_active', 'created_at']
    list_filter = ['region', 'is_active']
    search_fields = ['code', 'name']
