from django.contrib import admin
from .models import ServerAsset, AssetGroup


@admin.register(ServerAsset)
class ServerAssetAdmin(admin.ModelAdmin):
    list_display = ('name', 'ip_address', 'status', 'server_type', 'organization', 'responsible')
    list_filter = ('status', 'server_type', 'organization', 'is_active')
    search_fields = ('name', 'ip_address', 'hostname', 'tags')


@admin.register(AssetGroup)
class AssetGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'parent', 'organization', 'sort_order')
    list_filter = ('organization',)
    search_fields = ('name', 'code')
