from django.contrib import admin
from django.utils.html import format_html
from .models import DoctorProfile, DoctorSchedule, DailySlot


class DoctorScheduleInline(admin.TabularInline):
    model = DoctorSchedule
    extra = 1
    fields = ['day_of_week', 'shift', 'max_patients', 'start_time', 'end_time', 'is_active']


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = [
        'employee_no', 'name', 'title', 'department',
        'consultation_fee', 'is_active'
    ]
    list_filter = ['department', 'title', 'is_active']
    search_fields = ['employee_no', 'name', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [DoctorScheduleInline]
    fieldsets = (
        ('基本信息', {
            'fields': ('user', 'employee_no', 'name', 'title', 'department')
        }),
        ('专业信息', {
            'fields': ('specialties', 'consultation_fee')
        }),
        ('状态', {
            'fields': ('is_active',)
        }),
        ('系统信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(DoctorSchedule)
class DoctorScheduleAdmin(admin.ModelAdmin):
    list_display = [
        'doctor', 'get_day_of_week_display', 'shift',
        'max_patients', 'start_time', 'end_time', 'is_active'
    ]
    list_filter = ['day_of_week', 'shift', 'is_active', 'doctor__department']
    search_fields = ['doctor__name']
    ordering = ['day_of_week', 'shift']


@admin.register(DailySlot)
class DailySlotAdmin(admin.ModelAdmin):
    list_display = [
        'doctor', 'date', 'shift', 'max_patients', 'booked_count',
        'available_slots_display', 'status_tag'
    ]
    list_filter = ['status', 'shift', 'date', 'doctor__department']
    search_fields = ['doctor__name']
    readonly_fields = ['booked_count']
    date_hierarchy = 'date'
    ordering = ['-date', 'shift']
    actions = ['generate_slots_from_schedule', 'mark_as_cancelled']

    def available_slots_display(self, obj):
        available = obj.available_slots
        color = 'green' if available > 0 else 'red'
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, available
        )
    available_slots_display.short_description = '剩余号源'

    def status_tag(self, obj):
        colors = {
            'AVAILABLE': 'green',
            'FULL': 'orange',
            'CANCELLED': 'red',
        }
        color = colors.get(obj.status, 'gray')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_tag.short_description = '状态'

    def generate_slots_from_schedule(self, request, queryset):
        from datetime import timedelta
        from django.utils import timezone

        today = timezone.now().date()
        created_count = 0

        for schedule in DoctorSchedule.objects.filter(is_active=True):
            for week_offset in range(4):
                days_ahead = schedule.day_of_week - today.weekday()
                if days_ahead < 0:
                    days_ahead += 7
                days_ahead += week_offset * 7
                slot_date = today + timedelta(days=days_ahead)

                DailySlot.objects.get_or_create(
                    doctor=schedule.doctor,
                    date=slot_date,
                    shift=schedule.shift,
                    defaults={
                        'max_patients': schedule.max_patients,
                        'status': 'AVAILABLE'
                    }
                )
                created_count += 1

        self.message_user(request, f'已生成 {created_count} 个号源')
    generate_slots_from_schedule.short_description = '根据排班生成未来4周号源'

    def mark_as_cancelled(self, request, queryset):
        updated = queryset.update(status='CANCELLED')
        self.message_user(request, f'已将 {updated} 个号源标记为停诊')
    mark_as_cancelled.short_description = '标记为停诊'
