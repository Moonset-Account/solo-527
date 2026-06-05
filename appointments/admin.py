from django.contrib import admin, messages
from django.utils.html import format_html
from django.utils import timezone
from .models import (
    FollowUpPlan, RescheduleReason, Appointment,
    WaitingQueue, MedicationReminder
)


@admin.register(FollowUpPlan)
class FollowUpPlanAdmin(admin.ModelAdmin):
    list_display = [
        'patient', 'doctor', 'title', 'total_visits',
        'interval_days', 'next_appointment_date', 'status'
    ]
    list_filter = ['status', 'doctor__department', 'created_at']
    search_fields = ['patient__name', 'doctor__name', 'title']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at', 'updated_at', 'created_by']
    autocomplete_fields = ['patient', 'doctor']
    fieldsets = (
        ('基本信息', {
            'fields': ('patient', 'doctor', 'title', 'description')
        }),
        ('计划设置', {
            'fields': ('total_visits', 'interval_days', 'start_date', 'next_appointment_date')
        }),
        ('状态', {
            'fields': ('status',)
        }),
        ('系统信息', {
            'fields': ('created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(RescheduleReason)
class RescheduleReasonAdmin(admin.ModelAdmin):
    list_display = ['category', 'name', 'is_active', 'created_at']
    list_filter = ['category', 'is_active']
    search_fields = ['name', 'description']
    ordering = ['category', 'name']


class WaitingQueueInline(admin.StackedInline):
    model = WaitingQueue
    extra = 0
    readonly_fields = ['queue_date', 'queue_number', 'status', 'called_at', 'completed_at']
    can_delete = False


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = [
        'appointment_no', 'patient', 'doctor',
        'appointment_date', 'shift_display', 'status_tag',
        'payment_status', 'created_at'
    ]
    list_filter = [
        'status', 'payment_status', 'daily_slot__shift',
        'doctor__department', 'reschedule_reason__category'
    ]
    search_fields = [
        'appointment_no', 'patient__name', 'patient__patient_no',
        'doctor__name', 'reason'
    ]
    date_hierarchy = 'daily_slot__date'
    readonly_fields = [
        'appointment_no', 'original_reason', 'created_at',
        'updated_at', 'created_by', 'checked_in_at',
        'completed_at', 'cancelled_at'
    ]
    autocomplete_fields = ['patient', 'doctor', 'daily_slot', 'followup_plan']
    inlines = [WaitingQueueInline]
    actions = [
        'action_check_in',
        'action_complete',
        'action_mark_no_show',
        'action_cancel',
        'send_sms_reminder',
    ]
    fieldsets = (
        ('基本信息', {
            'fields': (
                'appointment_no', 'patient', 'doctor',
                'daily_slot', 'followup_plan', 'queue_number'
            )
        }),
        ('预约详情', {
            'fields': ('reason', 'original_reason', 'fee', 'payment_status')
        }),
        ('状态流转', {
            'fields': (
                'status', 'checked_in_at', 'completed_at', 'cancelled_at',
                'reschedule_reason', 'reschedule_note', 'original_appointment'
            )
        }),
        ('通知', {
            'fields': ('reminder_sent',)
        }),
        ('系统信息', {
            'fields': ('created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )

    def appointment_date(self, obj):
        return obj.daily_slot.date
    appointment_date.short_description = '就诊日期'
    appointment_date.admin_order_field = 'daily_slot__date'

    def shift_display(self, obj):
        return obj.daily_slot.get_shift_display()
    shift_display.short_description = '班次'

    def status_tag(self, obj):
        colors = {
            'BOOKED': 'blue',
            'CHECKED_IN': 'orange',
            'IN_PROGRESS': 'purple',
            'COMPLETED': 'green',
            'CANCELLED': 'gray',
            'NO_SHOW': 'red',
            'RESCHEDULED': 'brown',
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_tag.short_description = '状态'

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
        if obj.daily_slot:
            obj.daily_slot.update_booked_count()

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.role == 'DOCTOR':
            return qs.filter(doctor__user=request.user)
        if request.user.role == 'PATIENT':
            return qs.filter(patient__user=request.user)
        return qs

    def action_check_in(self, request, queryset):
        for apt in queryset.filter(status='BOOKED'):
            apt.check_in()
            WaitingQueue.objects.create(
                appointment=apt,
                doctor=apt.doctor,
                queue_date=apt.daily_slot.date,
                queue_number=WaitingQueue.objects.filter(
                    doctor=apt.doctor,
                    queue_date=apt.daily_slot.date
                ).count() + 1
            )
        self.message_user(request, f'已签到 {queryset.filter(status="BOOKED").count()} 人')
    action_check_in.short_description = '签到并加入候诊队列'

    def action_complete(self, request, queryset):
        updated = queryset.filter(status__in=['CHECKED_IN', 'IN_PROGRESS']).update(
            status='COMPLETED',
            completed_at=timezone.now()
        )
        for apt in queryset.filter(status='COMPLETED'):
            apt.daily_slot.update_booked_count()
        self.message_user(request, f'已完成 {updated} 个预约')
    action_complete.short_description = '标记为已完成'

    def action_mark_no_show(self, request, queryset):
        for apt in queryset.filter(status='BOOKED'):
            apt.mark_no_show()
            from notifications.services import SMSService
            SMSService.send_no_show_alert_to_nurse(apt.patient)
        self.message_user(request, f'已标记 {queryset.filter(status="BOOKED").count()} 个爽约')
    action_mark_no_show.short_description = '标记为爽约'

    def action_cancel(self, request, queryset):
        updated = queryset.filter(status='BOOKED').update(
            status='CANCELLED',
            cancelled_at=timezone.now()
        )
        for apt in queryset.filter(status='CANCELLED'):
            apt.daily_slot.update_booked_count()
        self.message_user(request, f'已取消 {updated} 个预约')
    action_cancel.short_description = '取消预约'

    def send_sms_reminder(self, request, queryset):
        from notifications.services import SMSService
        count = 0
        for apt in queryset.filter(status='BOOKED', reminder_sent=False):
            if SMSService.send_appointment_reminder(apt):
                count += 1
        self.message_user(request, f'已发送 {count} 条提醒短信')
    send_sms_reminder.short_description = '发送预约提醒短信'


@admin.register(WaitingQueue)
class WaitingQueueAdmin(admin.ModelAdmin):
    list_display = [
        'queue_date', 'doctor', 'queue_number',
        'patient_name', 'status_tag', 'called_at'
    ]
    list_filter = ['status', 'queue_date', 'doctor__department']
    search_fields = ['appointment__patient__name', 'doctor__name']
    date_hierarchy = 'queue_date'
    readonly_fields = ['created_at', 'updated_at']
    actions = ['call_patient', 'start_consultation', 'complete_consultation']
    ordering = ['queue_date', 'doctor', 'queue_number']

    def patient_name(self, obj):
        return obj.appointment.patient.name
    patient_name.short_description = '患者'

    def status_tag(self, obj):
        colors = {
            'WAITING': 'blue',
            'CALLED': 'orange',
            'IN_PROGRESS': 'purple',
            'COMPLETED': 'green',
            'LEFT': 'red',
        }
        color = colors.get(obj.status, 'black')
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_tag.short_description = '状态'

    def call_patient(self, request, queryset):
        updated = queryset.filter(status='WAITING').update(
            status='CALLED',
            called_at=timezone.now()
        )
        self.message_user(request, f'已叫号 {updated} 人')
    call_patient.short_description = '叫号'

    def start_consultation(self, request, queryset):
        updated = queryset.filter(status__in=['WAITING', 'CALLED']).update(
            status='IN_PROGRESS',
            called_at=timezone.now()
        )
        for q in queryset.filter(status='IN_PROGRESS'):
            q.appointment.start_consultation()
        self.message_user(request, f'开始接诊 {updated} 人')
    start_consultation.short_description = '开始接诊'

    def complete_consultation(self, request, queryset):
        updated = queryset.filter(status='IN_PROGRESS').update(
            status='COMPLETED',
            completed_at=timezone.now()
        )
        for q in queryset.filter(status='COMPLETED'):
            q.appointment.complete()
        self.message_user(request, f'完成接诊 {updated} 人')
    complete_consultation.short_description = '完成接诊'


@admin.register(MedicationReminder)
class MedicationReminderAdmin(admin.ModelAdmin):
    list_display = [
        'patient', 'medication_name', 'dosage',
        'frequency', 'start_date', 'end_date', 'is_active'
    ]
    list_filter = ['frequency', 'is_active', 'start_date']
    search_fields = ['patient__name', 'medication_name']
    readonly_fields = ['created_at', 'created_by']
    autocomplete_fields = ['patient', 'appointment']

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
