from django.contrib import admin
from .models import Notification, NotificationTemplate, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'recipient', 'type', 'priority', 'is_read', 'created_at')
    list_filter = ('type', 'priority', 'is_read', 'created_at')
    search_fields = ('title', 'content', 'recipient__real_name')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at', 'read_at')
    fieldsets = (
        ('基本信息', {'fields': ('recipient', 'type', 'priority')}),
        ('内容', {'fields': ('title', 'content', 'action_url')}),
        ('关联对象', {'fields': ('content_type', 'object_id')}),
        ('状态', {'fields': ('is_read', 'read_at')}),
        ('元数据', {'fields': ('created_at', 'updated_at', 'created_by', 'updated_by')}),
    )


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'is_active')
    list_filter = ('type', 'is_active')
    search_fields = ('name', 'title_template', 'content_template')
    fieldsets = (
        ('基本信息', {'fields': ('name', 'type', 'is_active', 'description')}),
        ('模板', {'fields': ('title_template', 'content_template', 'variables')}),
    )


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'email_enabled', 'push_enabled', 'sms_enabled')
    search_fields = ('user__real_name',)
    fieldsets = (
        ('用户', {'fields': ('user',)}),
        ('通知渠道', {'fields': ('email_enabled', 'push_enabled', 'sms_enabled')}),
        ('设置', {'fields': ('muted_types', 'quiet_hours_start', 'quiet_hours_end')}),
    )
