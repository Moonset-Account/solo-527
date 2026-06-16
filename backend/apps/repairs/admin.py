from django.contrib import admin
from .models import RepairRequest, RepairPhoto, RepairProgress, RepairComment
from import_export import resources
from import_export.admin import ImportExportModelAdmin


class RepairResource(resources.ModelResource):
    class Meta:
        model = RepairRequest
        fields = ('id', 'title', 'repair_type', 'priority', 'status', 'dorm_building',
                  'dorm_room', 'contact_name', 'contact_phone', 'applicant__real_name',
                  'assignee__real_name', 'created_at', 'completed_at')


class RepairPhotoInline(admin.TabularInline):
    model = RepairPhoto
    extra = 0


class RepairProgressInline(admin.TabularInline):
    model = RepairProgress
    extra = 0


@admin.register(RepairRequest)
class RepairRequestAdmin(ImportExportModelAdmin):
    resource_class = RepairResource
    list_display = ['id', 'title', 'repair_type', 'priority', 'status', 'dorm_building',
                    'dorm_room', 'applicant', 'assignee', 'created_at', 'completed_at']
    list_filter = ['status', 'repair_type', 'priority', 'dorm_building', 'created_at']
    search_fields = ['title', 'description', 'contact_name', 'contact_phone']
    inlines = [RepairPhotoInline, RepairProgressInline]
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(RepairProgress)
class RepairProgressAdmin(admin.ModelAdmin):
    list_display = ['repair_request', 'status', 'operator', 'created_at']
    list_filter = ['status', 'created_at']


@admin.register(RepairComment)
class RepairCommentAdmin(admin.ModelAdmin):
    list_display = ['repair_request', 'user', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
