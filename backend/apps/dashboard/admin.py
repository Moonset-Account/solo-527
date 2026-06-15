from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import DashboardWidget, DashboardLayout, LayoutWidget, Alert


class LayoutWidgetInline(admin.TabularInline):
    model = LayoutWidget
    extra = 1
    fields = ['widget', 'row', 'col', 'width', 'height']
    raw_id_fields = ['widget']


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ['title', 'name', 'get_widget_type_display', 'get_data_source_display', 'icon', 'color_scheme', 'size', 'refresh_interval', 'position', 'is_visible', 'created_by', 'created_at']
    list_filter = ['widget_type', 'data_source', 'color_scheme', 'size', 'is_visible', 'created_at']
    search_fields = ['name', 'title', 'icon']
    ordering = ['position', '-created_at']
    raw_id_fields = ['created_by']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        (_('基本信息'), {'fields': ('name', 'title', 'icon', 'created_by')}),
        (_('类型配置'), {'fields': ('widget_type', 'data_source')}),
        (_('显示配置'), {'fields': ('color_scheme', 'size', 'refresh_interval', 'position', 'is_visible', 'roles')}),
        (_('系统信息'), {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(DashboardLayout)
class DashboardLayoutAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'is_default', 'created_at']
    list_filter = ['is_default', 'created_at']
    search_fields = ['user__username', 'name']
    ordering = ['-created_at']
    raw_id_fields = ['user']
    inlines = [LayoutWidgetInline]
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        (_('基本信息'), {'fields': ('user', 'name', 'is_default')}),
        (_('系统信息'), {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(LayoutWidget)
class LayoutWidgetAdmin(admin.ModelAdmin):
    list_display = ['layout', 'widget', 'row', 'col', 'width', 'height', 'created_at']
    list_filter = ['row', 'col', 'width', 'height', 'created_at']
    search_fields = ['layout__name', 'widget__title']
    ordering = ['row', 'col']
    raw_id_fields = ['layout', 'widget']
    readonly_fields = ['created_at']


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['get_alert_type_display', 'get_source_display', 'title', 'assigned_to', 'is_read', 'read_at', 'is_action_required', 'is_resolved', 'resolved_at', 'resolved_by', 'is_demo', 'created_at']
    list_filter = ['alert_type', 'source', 'is_read', 'is_action_required', 'is_resolved', 'is_demo', 'created_at']
    search_fields = ['title', 'message', 'related_model']
    ordering = ['-created_at']
    raw_id_fields = ['assigned_to', 'resolved_by']
    readonly_fields = ['read_at', 'resolved_at', 'created_at']
    fieldsets = (
        (_('基本信息'), {'fields': ('alert_type', 'source', 'title', 'message')}),
        (_('关联信息'), {'fields': ('related_id', 'related_model')}),
        (_('状态信息'), {'fields': ('assigned_to', 'is_read', 'read_at', 'is_action_required', 'is_resolved', 'resolved_at', 'resolved_by', 'resolution_notes')}),
        (_('系统信息'), {'fields': ('is_demo', 'created_at')}),
    )
