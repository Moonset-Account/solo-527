from __future__ import absolute_import, unicode_literals
from celery import shared_task
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from django.db.models import Count, Sum, Q
from dateutil.relativedelta import relativedelta
from .models import ConversionFunnel, ConversionReport, StorePerformance, ConversionReminder
from apps.bookings.models import Booking
from apps.services.models import ServiceRecord
from apps.payments.models import PaymentOrder
from apps.membership.models import MemberMembership
from apps.accounts.models import User
from apps.dashboard.models import Alert


@shared_task
def generate_daily_report(report_date=None):
    if report_date is None:
        report_date = timezone.now().date() - timedelta(days=1)

    start_date = report_date
    end_date = report_date

    demo_filter = Q()
    if not settings.SHOW_DEMO_DATA:
        demo_filter = Q(is_demo=False)

    bookings = Booking.objects.filter(
        demo_filter,
        booking_date__range=(start_date, end_date),
    )

    total_bookings = bookings.count()
    total_arrivals = bookings.filter(arrival_time__isnull=False).count()
    arrival_rate = (total_arrivals / total_bookings * 100) if total_bookings > 0 else 0

    service_records = ServiceRecord.objects.filter(
        demo_filter,
        created_at__date__range=(start_date, end_date),
    )

    total_services = service_records.count()
    completed_services = service_records.filter(status='completed').count()
    service_completion_rate = (completed_services / total_services * 100) if total_services > 0 else 0

    payment_orders = PaymentOrder.objects.filter(
        demo_filter,
        paid_at__date__range=(start_date, end_date),
        status='paid',
    )

    total_payments = payment_orders.count()
    payment_rate = (total_payments / total_arrivals * 100) if total_arrivals > 0 else 0

    new_memberships = MemberMembership.objects.filter(
        demo_filter,
        created_at__date__range=(start_date, end_date),
    )
    new_memberships_count = new_memberships.count()
    membership_conversion_rate = (new_memberships_count / total_arrivals * 100) if total_arrivals > 0 else 0

    total_revenue = payment_orders.aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0

    membership_revenue = payment_orders.filter(
        order_type='membership'
    ).aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0

    service_revenue = payment_orders.filter(
        order_type='service'
    ).aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0

    average_order_value = (total_revenue / total_payments) if total_payments > 0 else 0

    discrepancies = PaymentOrder.objects.filter(
        demo_filter,
        paid_at__date__range=(start_date, end_date),
        has_discrepancy=True,
    )

    cashier_discrepancies = discrepancies.count()
    resolved_discrepancies = discrepancies.filter(discrepancy_resolved=True).count()
    unresolved_discrepancies = cashier_discrepancies - resolved_discrepancies

    report, created = ConversionReport.objects.update_or_create(
        report_type='daily',
        report_date=report_date,
        defaults={
            'start_date': start_date,
            'end_date': end_date,
            'total_bookings': total_bookings,
            'total_arrivals': total_arrivals,
            'arrival_rate': arrival_rate,
            'total_services': total_services,
            'service_completion_rate': service_completion_rate,
            'total_payments': total_payments,
            'payment_rate': payment_rate,
            'new_memberships': new_memberships_count,
            'membership_conversion_rate': membership_conversion_rate,
            'total_revenue': total_revenue,
            'membership_revenue': membership_revenue,
            'service_revenue': service_revenue,
            'average_order_value': average_order_value,
            'cashier_discrepancies': cashier_discrepancies,
            'resolved_discrepancies': resolved_discrepancies,
            'unresolved_discrepancies': unresolved_discrepancies,
        }
    )

    return f'Daily report for {report_date} generated: created={created}'


@shared_task
def generate_weekly_report(report_date=None):
    if report_date is None:
        report_date = timezone.now().date()

    start_date = report_date - timedelta(days=report_date.weekday())
    end_date = start_date + timedelta(days=6)

    return generate_period_report('weekly', report_date, start_date, end_date)


@shared_task
def generate_monthly_report(report_date=None):
    if report_date is None:
        report_date = timezone.now().date()

    start_date = report_date.replace(day=1)
    end_date = start_date + relativedelta(months=1) - timedelta(days=1)

    return generate_period_report('monthly', report_date, start_date, end_date)


def generate_period_report(report_type, report_date, start_date, end_date):
    demo_filter = Q()
    if not settings.SHOW_DEMO_DATA:
        demo_filter = Q(is_demo=False)

    bookings = Booking.objects.filter(
        demo_filter,
        booking_date__range=(start_date, end_date),
    )

    total_bookings = bookings.count()
    total_arrivals = bookings.filter(arrival_time__isnull=False).count()
    arrival_rate = (total_arrivals / total_bookings * 100) if total_bookings > 0 else 0

    service_records = ServiceRecord.objects.filter(
        demo_filter,
        created_at__date__range=(start_date, end_date),
    )

    total_services = service_records.count()
    completed_services = service_records.filter(status='completed').count()
    service_completion_rate = (completed_services / total_services * 100) if total_services > 0 else 0

    payment_orders = PaymentOrder.objects.filter(
        demo_filter,
        paid_at__date__range=(start_date, end_date),
        status='paid',
    )

    total_payments = payment_orders.count()
    payment_rate = (total_payments / total_arrivals * 100) if total_arrivals > 0 else 0

    new_memberships = MemberMembership.objects.filter(
        demo_filter,
        created_at__date__range=(start_date, end_date),
    )
    new_memberships_count = new_memberships.count()
    membership_conversion_rate = (new_memberships_count / total_arrivals * 100) if total_arrivals > 0 else 0

    total_revenue = payment_orders.aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0

    membership_revenue = payment_orders.filter(
        order_type='membership'
    ).aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0

    service_revenue = payment_orders.filter(
        order_type='service'
    ).aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0

    average_order_value = (total_revenue / total_payments) if total_payments > 0 else 0

    discrepancies = PaymentOrder.objects.filter(
        demo_filter,
        paid_at__date__range=(start_date, end_date),
        has_discrepancy=True,
    )

    cashier_discrepancies = discrepancies.count()
    resolved_discrepancies = discrepancies.filter(discrepancy_resolved=True).count()
    unresolved_discrepancies = cashier_discrepancies - resolved_discrepancies

    report, created = ConversionReport.objects.update_or_create(
        report_type=report_type,
        report_date=report_date,
        defaults={
            'start_date': start_date,
            'end_date': end_date,
            'total_bookings': total_bookings,
            'total_arrivals': total_arrivals,
            'arrival_rate': arrival_rate,
            'total_services': total_services,
            'service_completion_rate': service_completion_rate,
            'total_payments': total_payments,
            'payment_rate': payment_rate,
            'new_memberships': new_memberships_count,
            'membership_conversion_rate': membership_conversion_rate,
            'total_revenue': total_revenue,
            'membership_revenue': membership_revenue,
            'service_revenue': service_revenue,
            'average_order_value': average_order_value,
            'cashier_discrepancies': cashier_discrepancies,
            'resolved_discrepancies': resolved_discrepancies,
            'unresolved_discrepancies': unresolved_discrepancies,
        }
    )

    return f'{report_type} report for {report_date} generated: created={created}'


@shared_task
def update_store_performance(date=None):
    if date is None:
        date = timezone.now().date() - timedelta(days=1)

    demo_filter = Q()
    if not settings.SHOW_DEMO_DATA:
        demo_filter = Q(is_demo=False)

    bookings = Booking.objects.filter(
        demo_filter,
        booking_date=date,
    )

    total_visitors = bookings.filter(arrival_time__isnull=False).count()

    new_members = User.objects.filter(
        demo_filter,
        date_joined__date=date,
        role='member',
    ).count()

    payment_orders = PaymentOrder.objects.filter(
        demo_filter,
        paid_at__date=date,
        status='paid',
    )

    total_orders = payment_orders.count()
    total_revenue = payment_orders.aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0

    membership_payments = payment_orders.filter(order_type='membership')
    membership_sales = membership_payments.count()
    membership_revenue = membership_payments.aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0

    average_spend = (total_revenue / total_visitors) if total_visitors > 0 else 0

    conversion_rate = (total_orders / total_visitors * 100) if total_visitors > 0 else 0

    performance, created = StorePerformance.objects.update_or_create(
        date=date,
        defaults={
            'total_visitors': total_visitors,
            'new_customers': new_members,
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'membership_sales': membership_sales,
            'membership_revenue': membership_revenue,
            'average_spend': average_spend,
            'conversion_rate': conversion_rate,
        }
    )

    return f'Store performance for {date} updated'


@shared_task
def check_pending_conversion_reminders():
    now = timezone.now()

    pending_reminders = ConversionReminder.objects.filter(
        is_completed=False,
        scheduled_time__lte=now
    )

    count = 0
    for reminder in pending_reminders:
        Alert.objects.create(
            alert_type='warning',
            source='conversion',
            title='转化跟进提醒',
            message=f'请跟进预约{reminder.funnel.booking.order_no}的{reminder.get_reminder_type_display()}，分配给：{reminder.assigned_to.username}',
            related_id=reminder.id,
            related_model='conversion.ConversionReminder',
            assigned_to=reminder.assigned_to,
            is_action_required=True,
            is_demo=reminder.is_demo
        )
        count += 1

    return f'Created {count} alerts for pending conversion reminders'


@shared_task
def create_follow_up_reminders():
    now = timezone.now()
    three_days_ago = now - timedelta(days=3)

    funnels = ConversionFunnel.objects.filter(
        current_stage='payment',
        membership_converted=False,
        updated_at__lte=three_days_ago,
        follow_up_status='pending'
    )

    count = 0
    for funnel in funnels:
        managers = User.objects.filter(role__in=['manager', 'staff'])
        if managers.exists():
            ConversionReminder.objects.create(
                funnel=funnel,
                reminder_type='follow_up',
                assigned_to=managers.first(),
                scheduled_time=now + timedelta(hours=2),
                notes='客户已支付但未转化会员，需要跟进推广会员套餐',
                is_demo=funnel.is_demo
            )
            count += 1

    return f'Created {count} follow-up reminders'


@shared_task
def check_expiring_memberships():
    now = timezone.now()
    thirty_days_later = now + timedelta(days=30)

    expiring_memberships = MemberMembership.objects.filter(
        status='active',
        end_date__lte=thirty_days_later,
        end_date__gte=now.date(),
        is_auto_renew=False
    )

    count = 0
    for membership in expiring_memberships:
        Alert.objects.create(
            alert_type='info',
            source='conversion',
            title='会员即将到期',
            message=f'会员{membership.member.username}的{membership.package.name}将于{membership.end_date}到期，请联系续费。',
            related_id=membership.id,
            related_model='membership.MemberMembership',
            assigned_to=membership.member,
            is_action_required=False,
            is_demo=membership.is_demo
        )
        count += 1

    return f'Created {count} membership expiration alerts'
