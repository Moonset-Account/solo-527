from django.contrib import admin
from .models import OperationLog, SystemConfig, PublicSeaRule

@admin.register(OperationLog)
class OperationLogAdmin(admin.ModelAdmin):
    list_display = ['action', 'user', 'content_type', 'object_id', 'created_at']
    list_filter = ['action', 'content_type', 'created_at']
    search_fields = ['description', 'user__username']
    readonly_fields = ['created_at']

@admin.register(SystemConfig)
class SystemConfigAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'description', 'updated_at']
    search_fields = ['key', 'description']

@admin.register(PublicSeaRule)
class PublicSeaRuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'timeout_days', 'is_active', 'updated_at']
    list_filter = ['is_active']
