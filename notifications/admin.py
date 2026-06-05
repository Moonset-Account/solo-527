from django.contrib import admin
from django.utils.html import format_html
from .models import SMSMessage, Notification


@admin.register(SMSMessage)
class SMSMessageAdmin(admin.ModelAdmin):
    list_display = [
        'message_type', 'phone_number', 'status_tag',
        'scheduled_send_time', 'sent_at', 'created_at'
    ]
    list_filter = ['status', 'message_type', 'created_at']
    search_fields = ['phone_number', 'content', 'patient__name']
    date_hierarchy = 'created_at'
    readonly_fields = [
        'provider_message_id', 'sent_at', 'delivered_at',
        'error_message', 'retry_count', 'created_at', 'created_by'
    ]
    actions = ['send_sms', 'retry_failed']
    fieldsets = (
        ('基本信息', {
            'fields': (
                'patient', 'appointment', 'medication_reminder',
                'message_type', 'phone_number'
            )
        }),
        ('消息内容', {
            'fields': ('content',)
        }),
        ('发送计划', {
            'fields': ('scheduled_send_time',)
        }),
        ('状态信息', {
            'fields': (
                'status', 'provider_message_id', 'sent_at',
                'delivered_at', 'error_message', 'retry_count'
            )
        }),
        ('系统信息', {
            'fields': ('created_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )

    def status_tag(self, obj):
        colors = {
            'PENDING': 'orange',
            'SENT': 'blue',
            'FAILED': 'red',
            'DELIVERED': 'green',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_tag.short_description = '状态'

    def send_sms(self, request, queryset):
        from .services import SMSService
        count = 0
        for sms in queryset.filter(status='PENDING'):
            if SMSService._send(sms):
                count += 1
        self.message_user(request, f'已发送 {count} 条短信')
    send_sms.short_description = '发送选中的短信'

    def retry_failed(self, request, queryset):
        from .services import SMSService
        count = 0
        for sms in queryset.filter(status='FAILED'):
            sms.status = 'PENDING'
            sms.save()
            if SMSService._send(sms):
                count += 1
        self.message_user(request, f'重试成功 {count} 条')
    retry_failed.short_description = '重试失败的短信'


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'title', 'type', 'status_tag', 'created_at', 'read_at'
    ]
    list_filter = ['type', 'status', 'created_at']
    search_fields = ['user__username', 'title', 'message']
    date_hierarchy = 'created_at'
    readonly_fields = ['read_at', 'created_at']
    actions = ['mark_as_read', 'mark_all_as_read']
    fieldsets = (
        ('通知信息', {
            'fields': ('user', 'title', 'message', 'type', 'related_url')
        }),
        ('状态', {
            'fields': ('status', 'read_at')
        }),
        ('系统信息', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )

    def status_tag(self, obj):
        if obj.status == 'UNREAD':
            return format_html(
                '<span style="color: red; font-weight: bold;">未读</span>'
            )
        return format_html(
            '<span style="color: green;">已读</span>'
        )
    status_tag.short_description = '状态'

    def mark_as_read(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(status='UNREAD').update(
            status='READ',
            read_at=timezone.now()
        )
        self.message_user(request, f'已标记 {updated} 条为已读')
    mark_as_read.short_description = '标记为已读'
