from django.contrib import admin
from .models import Booking, BookingConflict


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('equipment', 'user', 'start_time', 'end_time', 'status', 'is_checked_in')
    list_filter = ('status', 'equipment', 'start_time')
    search_fields = ('user__real_name', 'equipment__name', 'purpose')
    date_hierarchy = 'start_time'
    readonly_fields = ('created_at', 'updated_at', 'checked_in_at', 'approved_at', 'actual_start_time', 'actual_end_time')
    fieldsets = (
        ('预约信息', {'fields': ('equipment', 'user', 'purpose')}),
        ('时间', {'fields': ('start_time', 'end_time', 'actual_start_time', 'actual_end_time')}),
        ('审批', {'fields': ('status', 'approval_notes', 'approved_by', 'approved_at')}),
        ('签到', {'fields': ('check_in_code', 'is_checked_in', 'checked_in_at')}),
        ('元数据', {'fields': ('created_at', 'updated_at', 'created_by', 'updated_by')}),
    )


@admin.register(BookingConflict)
class BookingConflictAdmin(admin.ModelAdmin):
    list_display = ('booking', 'conflicting_booking', 'detected_at')
    readonly_fields = ('detected_at',)
