from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Booking, BookingReminder, TimeSlot


class BookingReminderInline(admin.TabularInline):
    model = BookingReminder
    extra = 0
    fields = ['reminder_type', 'scheduled_time', 'sent_time', 'status', 'content']
    readonly_fields = ['sent_time']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['order_no', 'get_booking_type_display', 'member', 'vehicle', 'service_item', 'booking_date', 'booking_time', 'contact_name', 'contact_phone', 'get_status_display', 'reminder_sent', 'is_demo', 'created_at']
    list_filter = ['booking_type', 'status', 'booking_date', 'reminder_sent', 'is_demo', 'created_at']
    search_fields = ['order_no', 'member__username', 'member__phone', 'contact_name', 'contact_phone', 'vehicle__plate_number']
    ordering = ['-booking_date', '-booking_time']
    raw_id_fields = ['member', 'vehicle', 'service_item', 'test_drive_slot', 'assigned_staff']
    inlines = [BookingReminderInline]
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        (_('基本信息'), {'fields': ('order_no', 'booking_type', 'source')}),
        (_('客户信息'), {'fields': ('member', 'vehicle', 'contact_name', 'contact_phone')}),
        (_('预约内容'), {'fields': ('service_item', 'test_drive_slot', 'booking_date', 'booking_time')}),
        (_('状态信息'), {'fields': ('status', 'assigned_staff', 'reminder_sent', 'arrival_time')}),
        (_('备注信息'), {'fields': ('notes',)}),
        (_('系统信息'), {'fields': ('is_demo', 'created_at', 'updated_at')}),
    )


@admin.register(BookingReminder)
class BookingReminderAdmin(admin.ModelAdmin):
    list_display = ['booking', 'get_reminder_type_display', 'scheduled_time', 'sent_time', 'get_status_display']
    list_filter = ['reminder_type', 'status', 'scheduled_time', 'sent_time']
    search_fields = ['booking__order_no', 'content']
    ordering = ['-scheduled_time']
    raw_id_fields = ['booking']
    readonly_fields = ['sent_time', 'created_at']
    fieldsets = (
        (_('关联信息'), {'fields': ('booking',)}),
        (_('提醒配置'), {'fields': ('reminder_type', 'scheduled_time', 'content')}),
        (_('发送状态'), {'fields': ('status', 'sent_time', 'error_message')}),
        (_('系统信息'), {'fields': ('created_at',)}),
    )


@admin.register(TimeSlot)
class TimeSlotAdmin(admin.ModelAdmin):
    list_display = ['date', 'start_time', 'end_time', 'max_capacity', 'current_bookings', 'is_available', 'is_demo', 'created_at']
    list_filter = ['date', 'is_available', 'is_demo', 'created_at']
    search_fields = ['date']
    ordering = ['date', 'start_time']
    readonly_fields = ['created_at']
    fieldsets = (
        (_('时间配置'), {'fields': ('date', 'start_time', 'end_time')}),
        (_('容量配置'), {'fields': ('max_capacity', 'current_bookings')}),
        (_('状态信息'), {'fields': ('is_available', 'is_demo')}),
        (_('系统信息'), {'fields': ('created_at',)}),
    )
