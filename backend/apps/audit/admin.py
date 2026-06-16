from django.contrib import admin
from django.contrib.contenttypes.admin import GenericTabularInline
from import_export import resources
from import_export.admin import ImportExportModelAdmin
from .models import AuditLog, OperationType


class AuditLogResource(resources.ModelResource):
    class Meta:
        model = AuditLog
        fields = ('id', 'username', 'operation', 'module', 'description',
                  'ip_address', 'created_at')


@admin.register(AuditLog)
class AuditLogAdmin(ImportExportModelAdmin):
    resource_class = AuditLogResource
    list_display = ['username', 'operation', 'module', 'description', 'ip_address', 'created_at']
    list_filter = ['operation', 'module', 'created_at']
    search_fields = ['username', 'description', 'module']
    readonly_fields = ['user', 'username', 'operation', 'module', 'description',
                       'content_type', 'object_id', 'old_data', 'new_data',
                       'ip_address', 'user_agent', 'created_at']
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
