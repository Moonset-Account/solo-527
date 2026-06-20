from django.contrib import admin
from .models import InspectionTemplate, InspectionItem, InspectionTask, InspectionResult


@admin.register(InspectionTemplate)
class InspectionTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active', 'organization', 'created_at')
    list_filter = ('is_active', 'organization')
    search_fields = ('name', 'code')


@admin.register(InspectionItem)
class InspectionItemAdmin(admin.ModelAdmin):
    list_display = ('template', 'name', 'item_type', 'sort_order')
    list_filter = ('item_type', 'template__organization')
    search_fields = ('name', 'metric')


@admin.register(InspectionTask)
class InspectionTaskAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'template', 'status', 'trigger_type', 'started_at')
    list_filter = ('status', 'trigger_type', 'template__organization')
    search_fields = ('code', 'name')


@admin.register(InspectionResult)
class InspectionResultAdmin(admin.ModelAdmin):
    list_display = ('task', 'item', 'server', 'status')
    list_filter = ('status',)
    search_fields = ('task__code', 'message')
