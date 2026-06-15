from rest_framework import serializers
from django.utils import timezone
from django.conf import settings
from .models import ConversionFunnel, ConversionReport, ConversionReminder, StorePerformance
from apps.accounts.models import User
from apps.bookings.models import Booking
from apps.payments.models import PaymentOrder
from apps.services.models import ServiceRecord


class ConversionFunnelSerializer(serializers.ModelSerializer):
    current_stage_display = serializers.CharField(source='get_current_stage_display', read_only=True)
    follow_up_status_display = serializers.CharField(source='get_follow_up_status_display', read_only=True)
    booking_order_no = serializers.CharField(source='booking.order_no', read_only=True)
    booking_customer_name = serializers.CharField(source='booking.contact_name', read_only=True)
    booking_customer_phone = serializers.CharField(source='booking.contact_phone', read_only=True)
    service_record_id = serializers.CharField(source='service_record.id', read_only=True, allow_null=True)
    payment_order_no = serializers.CharField(source='payment_order.order_no', read_only=True, allow_null=True)
    converted_by_username = serializers.CharField(source='converted_by.username', read_only=True, allow_null=True)

    booking_id = serializers.PrimaryKeyRelatedField(
        queryset=Booking.objects.all(), source='booking', write_only=True, required=False
    )
    service_record_id_write = serializers.PrimaryKeyRelatedField(
        queryset=ServiceRecord.objects.all(), source='service_record', write_only=True, required=False, allow_null=True
    )
    payment_order_id_write = serializers.PrimaryKeyRelatedField(
        queryset=PaymentOrder.objects.all(), source='payment_order', write_only=True, required=False, allow_null=True
    )
    converted_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__in=['staff', 'manager', 'admin']), source='converted_by',
        write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = ConversionFunnel
        fields = [
            'id', 'booking', 'booking_id', 'booking_order_no', 'booking_customer_name', 'booking_customer_phone',
            'current_stage', 'current_stage_display',
            'arrival_time', 'service_start_time', 'service_end_time', 'payment_time',
            'membership_converted', 'conversion_time',
            'service_record', 'service_record_id', 'service_record_id_write',
            'payment_order', 'payment_order_no', 'payment_order_id_write',
            'converted_by', 'converted_by_id', 'converted_by_username',
            'conversion_amount', 'follow_up_status', 'follow_up_status_display',
            'follow_up_notes', 'next_follow_up', 'is_demo', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate_stage_transition(self, funnel, new_stage):
        stage_order = ['booking', 'arrival', 'service', 'payment', 'membership']
        current_idx = stage_order.index(funnel.current_stage)
        new_idx = stage_order.index(new_stage)
        if new_idx < current_idx:
            raise serializers.ValidationError('不能回退到之前的阶段')
        if new_idx > current_idx + 1:
            raise serializers.ValidationError('不能跳过阶段')
        return True

    def advance_stage(self, funnel, new_stage, **kwargs):
        self.validate_stage_transition(funnel, new_stage)
        now = timezone.now()
        
        if new_stage == 'arrival':
            funnel.arrival_time = now
        elif new_stage == 'service':
            funnel.service_start_time = now
        elif new_stage == 'payment':
            funnel.service_end_time = now
            funnel.payment_time = now
        elif new_stage == 'membership':
            funnel.membership_converted = True
            funnel.conversion_time = now
            funnel.converted_by = kwargs.get('converted_by')
            funnel.conversion_amount = kwargs.get('conversion_amount', 0)
        
        funnel.current_stage = new_stage
        funnel.save()
        return funnel

    def convert_to_membership(self, funnel, converted_by, conversion_amount):
        if funnel.current_stage != 'payment':
            raise serializers.ValidationError('只有已支付的订单才能转化为会员')
        return self.advance_stage(funnel, 'membership', converted_by=converted_by, conversion_amount=conversion_amount)


class ConversionReportSerializer(serializers.ModelSerializer):
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    generated_by_username = serializers.CharField(source='generated_by.username', read_only=True, allow_null=True)

    generated_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__in=['manager', 'admin']), source='generated_by',
        write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = ConversionReport
        fields = [
            'id', 'report_type', 'report_type_display', 'report_date',
            'start_date', 'end_date',
            'total_bookings', 'total_arrivals', 'arrival_rate',
            'total_services', 'service_completion_rate',
            'total_payments', 'payment_rate',
            'new_memberships', 'membership_conversion_rate',
            'total_revenue', 'membership_revenue', 'service_revenue', 'average_order_value',
            'cashier_discrepancies', 'resolved_discrepancies', 'unresolved_discrepancies',
            'generated_by', 'generated_by_id', 'generated_by_username',
            'is_demo', 'created_at'
        ]
        read_only_fields = [
            'created_at', 'total_bookings', 'total_arrivals', 'arrival_rate',
            'total_services', 'service_completion_rate', 'total_payments', 'payment_rate',
            'new_memberships', 'membership_conversion_rate', 'total_revenue',
            'membership_revenue', 'service_revenue', 'average_order_value',
            'cashier_discrepancies', 'resolved_discrepancies', 'unresolved_discrepancies'
        ]

    def generate_report(self, report_type, report_date, generated_by=None):
        from django.db import models
        from django.db.models import Count, Sum, Q
        
        if report_type == 'daily':
            start_date = report_date
            end_date = report_date
        elif report_type == 'weekly':
            start_date = report_date - timezone.timedelta(days=report_date.weekday())
            end_date = start_date + timezone.timedelta(days=6)
        elif report_type == 'monthly':
            start_date = report_date.replace(day=1)
            if start_date.month == 12:
                end_date = start_date.replace(year=start_date.year + 1, month=1, day=1) - timezone.timedelta(days=1)
            else:
                end_date = start_date.replace(month=start_date.month + 1, day=1) - timezone.timedelta(days=1)
        else:
            raise serializers.ValidationError('无效的报表类型')

        show_demo = getattr(settings, 'SHOW_DEMO_DATA', False)
        funnel_qs = ConversionFunnel.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )
        if not show_demo:
            funnel_qs = funnel_qs.filter(is_demo=False)

        total_bookings = funnel_qs.count()
        total_arrivals = funnel_qs.filter(current_stage__in=['arrival', 'service', 'payment', 'membership']).count()
        arrival_rate = (total_arrivals / total_bookings * 100) if total_bookings > 0 else 0
        total_services = funnel_qs.filter(current_stage__in=['service', 'payment', 'membership']).count()
        service_completion_rate = (total_services / total_arrivals * 100) if total_arrivals > 0 else 0
        total_payments = funnel_qs.filter(current_stage__in=['payment', 'membership']).count()
        payment_rate = (total_payments / total_services * 100) if total_services > 0 else 0
        new_memberships = funnel_qs.filter(membership_converted=True).count()
        membership_conversion_rate = (new_memberships / total_payments * 100) if total_payments > 0 else 0

        total_revenue = funnel_qs.aggregate(Sum('conversion_amount'))['conversion_amount__sum'] or 0
        membership_revenue = funnel_qs.filter(membership_converted=True).aggregate(Sum('conversion_amount'))['conversion_amount__sum'] or 0
        service_revenue = total_revenue - membership_revenue
        average_order_value = (total_revenue / total_payments) if total_payments > 0 else 0

        from apps.payments.models import PaymentOrder
        discrepancy_qs = PaymentOrder.objects.filter(
            has_discrepancy=True,
            paid_at__date__gte=start_date,
            paid_at__date__lte=end_date
        )
        if not show_demo:
            discrepancy_qs = discrepancy_qs.filter(is_demo=False)

        cashier_discrepancies = discrepancy_qs.count()
        resolved_discrepancies = discrepancy_qs.filter(discrepancy_resolved=True).count()
        unresolved_discrepancies = cashier_discrepancies - resolved_discrepancies

        report, created = ConversionReport.objects.update_or_create(
            report_type=report_type,
            report_date=report_date,
            defaults={
                'start_date': start_date,
                'end_date': end_date,
                'total_bookings': total_bookings,
                'total_arrivals': total_arrivals,
                'arrival_rate': round(arrival_rate, 2),
                'total_services': total_services,
                'service_completion_rate': round(service_completion_rate, 2),
                'total_payments': total_payments,
                'payment_rate': round(payment_rate, 2),
                'new_memberships': new_memberships,
                'membership_conversion_rate': round(membership_conversion_rate, 2),
                'total_revenue': total_revenue,
                'membership_revenue': membership_revenue,
                'service_revenue': service_revenue,
                'average_order_value': round(average_order_value, 2),
                'cashier_discrepancies': cashier_discrepancies,
                'resolved_discrepancies': resolved_discrepancies,
                'unresolved_discrepancies': unresolved_discrepancies,
                'generated_by': generated_by,
                'is_demo': getattr(generated_by, 'is_demo', False) if generated_by else False
            }
        )
        return report


class ConversionReminderSerializer(serializers.ModelSerializer):
    reminder_type_display = serializers.CharField(source='get_reminder_type_display', read_only=True)
    funnel_booking_order_no = serializers.CharField(source='funnel.booking.order_no', read_only=True)
    funnel_customer_name = serializers.CharField(source='funnel.booking.contact_name', read_only=True)
    funnel_customer_phone = serializers.CharField(source='funnel.booking.contact_phone', read_only=True)
    assigned_to_username = serializers.CharField(source='assigned_to.username', read_only=True)

    funnel_id = serializers.PrimaryKeyRelatedField(
        queryset=ConversionFunnel.objects.all(), source='funnel', write_only=True, required=False
    )
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role__in=['staff', 'manager', 'admin']), source='assigned_to',
        write_only=True, required=False
    )

    class Meta:
        model = ConversionReminder
        fields = [
            'id', 'funnel', 'funnel_id', 'funnel_booking_order_no', 'funnel_customer_name', 'funnel_customer_phone',
            'reminder_type', 'reminder_type_display',
            'assigned_to', 'assigned_to_id', 'assigned_to_username',
            'scheduled_time', 'reminded_at', 'is_completed', 'completed_at',
            'result', 'notes', 'is_demo', 'created_at'
        ]
        read_only_fields = ['created_at', 'reminded_at', 'is_completed', 'completed_at']

    def complete(self, reminder, result, notes=None):
        if reminder.is_completed:
            raise serializers.ValidationError('该提醒已完成')
        reminder.is_completed = True
        reminder.completed_at = timezone.now()
        reminder.result = result
        if notes:
            reminder.notes = notes
        reminder.save()
        return reminder

    def batch_assign(self, reminder_ids, assigned_to):
        reminders = ConversionReminder.objects.filter(id__in=reminder_ids, is_completed=False)
        show_demo = getattr(settings, 'SHOW_DEMO_DATA', False)
        if not show_demo:
            reminders = reminders.filter(is_demo=False)
        updated_count = reminders.update(assigned_to=assigned_to)
        return updated_count


class StorePerformanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StorePerformance
        fields = [
            'id', 'date', 'total_visitors', 'new_customers', 'returning_customers',
            'total_orders', 'total_revenue', 'membership_sales', 'membership_revenue',
            'average_spend', 'conversion_rate', 'is_demo', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def calculate_stats(self, performance):
        if performance.total_visitors > 0:
            performance.conversion_rate = round((performance.total_orders / performance.total_visitors) * 100, 2)
        if performance.total_orders > 0:
            performance.average_spend = round(performance.total_revenue / performance.total_orders, 2)
        performance.returning_customers = performance.total_visitors - performance.new_customers
        return performance
