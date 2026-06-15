from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import ConversionFunnel, ConversionReport, ConversionReminder, StorePerformance


class ConversionReminderInline(admin.TabularInline):
    model = ConversionReminder
    extra = 0
    fields = ['reminder_type', 'assigned_to', 'scheduled_time', 'reminded_at', 'is_completed', 'completed_at']
    raw_id_fields = ['assigned_to']
    readonly_fields = ['reminded_at', 'completed_at']


@admin.register(ConversionFunnel)
class ConversionFunnelAdmin(admin.ModelAdmin):
    list_display = ['booking', 'get_current_stage_display', 'arrival_time', 'service_start_time', 'service_end_time', 'payment_time', 'membership_converted', 'conversion_amount', 'follow_up_status', 'is_demo', 'created_at']
    list_filter = ['current_stage', 'membership_converted', 'follow_up_status', 'is_demo', 'created_at']
    search_fields = ['booking__order_no', 'booking__member__username', 'booking__member__phone']
    ordering = ['-created_at']
    raw_id_fields = ['booking', 'service_record', 'payment_order', 'converted_by']
    inlines = [ConversionReminderInline]
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        (_('关联信息'), {'fields': ('booking', 'service_record', 'payment_order')}),
        (_('转化阶段'), {'fields': ('current_stage',)}),
        (_('时间节点'), {'fields': ('arrival_time', 'service_start_time', 'service_end_time', 'payment_time')}),
        (_('会员转化'), {'fields': ('membership_converted', 'conversion_time', 'converted_by', 'conversion_amount')}),
        (_('跟进信息'), {'fields': ('follow_up_status', 'follow_up_notes', 'next_follow_up')}),
        (_('系统信息'), {'fields': ('is_demo', 'created_at', 'updated_at')}),
    )


@admin.register(ConversionReport)
class ConversionReportAdmin(admin.ModelAdmin):
    list_display = ['get_report_type_display', 'report_date', 'start_date', 'end_date', 'total_bookings', 'total_arrivals', 'arrival_rate', 'total_services', 'service_completion_rate', 'total_payments', 'payment_rate', 'new_memberships', 'membership_conversion_rate', 'total_revenue', 'average_order_value', 'is_demo', 'created_at']
    list_filter = ['report_type', 'report_date', 'is_demo', 'created_at']
    search_fields = ['report_date']
    ordering = ['-report_date']
    raw_id_fields = ['generated_by']
    readonly_fields = ['created_at']
    fieldsets = (
        (_('基本信息'), {'fields': ('report_type', 'report_date', 'start_date', 'end_date', 'generated_by')}),
        (_('预约到店'), {'fields': ('total_bookings', 'total_arrivals', 'arrival_rate')}),
        (_('服务转化'), {'fields': ('total_services', 'service_completion_rate')}),
        (_('支付转化'), {'fields': ('total_payments', 'payment_rate')}),
        (_('会员转化'), {'fields': ('new_memberships', 'membership_conversion_rate')}),
        (_('营收数据'), {'fields': ('total_revenue', 'membership_revenue', 'service_revenue', 'average_order_value')}),
        (_('差异数据'), {'fields': ('cashier_discrepancies', 'resolved_discrepancies', 'unresolved_discrepancies')}),
        (_('系统信息'), {'fields': ('is_demo', 'created_at')}),
    )


@admin.register(ConversionReminder)
class ConversionReminderAdmin(admin.ModelAdmin):
    list_display = ['funnel', 'get_reminder_type_display', 'assigned_to', 'scheduled_time', 'reminded_at', 'is_completed', 'completed_at', 'is_demo', 'created_at']
    list_filter = ['reminder_type', 'is_completed', 'scheduled_time', 'is_demo', 'created_at']
    search_fields = ['funnel__booking__order_no', 'assigned_to__username']
    ordering = ['-scheduled_time']
    raw_id_fields = ['funnel', 'assigned_to']
    readonly_fields = ['reminded_at', 'completed_at', 'created_at']
    fieldsets = (
        (_('关联信息'), {'fields': ('funnel',)}),
        (_('提醒配置'), {'fields': ('reminder_type', 'assigned_to', 'scheduled_time')}),
        (_('处理状态'), {'fields': ('is_completed', 'reminded_at', 'completed_at', 'result', 'notes')}),
        (_('系统信息'), {'fields': ('is_demo', 'created_at')}),
    )


@admin.register(StorePerformance)
class StorePerformanceAdmin(admin.ModelAdmin):
    list_display = ['date', 'total_visitors', 'new_customers', 'returning_customers', 'total_orders', 'total_revenue', 'membership_sales', 'membership_revenue', 'average_spend', 'conversion_rate', 'is_demo', 'created_at']
    list_filter = ['date', 'is_demo', 'created_at']
    search_fields = ['date']
    ordering = ['-date']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        (_('基本信息'), {'fields': ('date',)}),
        (_('客流数据'), {'fields': ('total_visitors', 'new_customers', 'returning_customers')}),
        (_('订单数据'), {'fields': ('total_orders', 'total_revenue', 'average_spend')}),
        (_('会员数据'), {'fields': ('membership_sales', 'membership_revenue')}),
        (_('转化数据'), {'fields': ('conversion_rate',)}),
        (_('系统信息'), {'fields': ('is_demo', 'created_at', 'updated_at')}),
    )
