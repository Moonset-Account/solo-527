from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'user_name', 'type', 'channel',
        'is_read', 'sent_at', 'created_at'
    ]
    list_filter = [
        'type', 'channel', 'is_read', 'sent_at',
        'created_at', 'is_test_data'
    ]
    search_fields = ['title', 'content', 'user__first_name', 'user__last_name']
    date_hierarchy = 'sent_at'
    fieldsets = (
        ('基本信息', {
            'fields': ('user', 'title', 'content', 'type', 'channel')
        }),
        ('状态', {
            'fields': ('is_read', 'read_at', 'is_sent', 'sent_at', 'scheduled_at')
        }),
        ('关联', {
            'fields': ('related_id', 'related_type')
        }),
        ('错误', {
            'fields': ('error_message',)
        }),
        ('其他', {
            'fields': ('is_test_data',)
        })
    )
    readonly_fields = ('sent_at', 'read_at', 'error_message')

    def user_name(self, obj):
        return obj.user.get_full_name()

    user_name.short_description = '接收人'
