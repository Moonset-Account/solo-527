from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('username', 'action', 'resource_type', 'path', 'is_success', 'duration_ms', 'created_at')
    list_filter = ('action', 'is_success', 'organization')
    search_fields = ('username', 'path', 'detail', 'resource_name')
    readonly_fields = ('created_at',)
