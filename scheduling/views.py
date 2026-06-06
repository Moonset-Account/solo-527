from datetime import date, timedelta
import calendar
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.db.models import Q
from django.utils import timezone
from .models import DailySchedule, ScheduleConflict, Notification
from .services import ConflictDetectionService
from exhibitions.models import BorrowOrder, BorrowItem, TransportRecord, Exhibition
from inventory.exporters import ExportService


@login_required
def calendar_view(request):
    today = timezone.now().date()
    year = request.GET.get('year', today.year)
    month = request.GET.get('month', today.month)

    year = int(year)
    month = int(month)

    cal = calendar.monthcalendar(year, month)

    first_day = date(year, month, 1)
    last_day = date(year, month, cal[-1][-1] if cal[-1][-1] else cal[-2][-1])

    exhibitions = Exhibition.objects.filter(
        Q(start_date__lte=last_day) & Q(end_date__gte=first_day),
        status__in=[Exhibition.PLANNING, Exhibition.INSTALLATION, Exhibition.OPEN]
    ).select_related('hall', 'curator')

    borrow_orders = BorrowOrder.objects.filter(
        Q(expected_pickup_date__range=[first_day, last_day]) |
        Q(expected_return_date__range=[first_day, last_day]),
        status__in=[BorrowOrder.APPROVED, BorrowOrder.PICKED_UP, BorrowOrder.PARTIAL_RETURNED]
    ).select_related('exhibition', 'hall')

    conflicts = ScheduleConflict.objects.filter(
        conflict_date__range=[first_day, last_day],
        is_resolved=False
    )

    prev_month = month - 1 if month > 1 else 12
    prev_year = year if month > 1 else year - 1
    next_month = month + 1 if month < 12 else 1
    next_year = year if month < 12 else year + 1

    context = {
        'year': year,
        'month': month,
        'month_name': calendar.month_name[month],
        'calendar': cal,
        'today': today,
        'exhibitions': exhibitions,
        'borrow_orders': borrow_orders,
        'conflicts': conflicts,
        'prev_month': prev_month,
        'prev_year': prev_year,
        'next_month': next_month,
        'next_year': next_year,
    }

    return render(request, 'scheduling/calendar.html', context)


@login_required
def day_detail_view(request, year, month, day):
    target_date = date(year, month, day)

    conflicts = ConflictDetectionService.get_day_conflicts(target_date)

    unreturned_items = BorrowItem.objects.filter(
        status__in=[BorrowItem.PICKED_UP, BorrowItem.PENDING],
        borrow_order__expected_return_date__lt=target_date
    ).select_related('borrow_order', 'borrow_order__exhibition', 'material')

    in_transit = TransportRecord.objects.filter(
        status=TransportRecord.IN_TRANSIT
    ).select_related('borrow_order', 'borrow_order__exhibition')

    borrow_orders_today = BorrowOrder.objects.filter(
        Q(expected_pickup_date=target_date) |
        Q(expected_return_date=target_date)
    ).select_related('exhibition', 'hall', 'requester').distinct()

    exhibitions = Exhibition.objects.filter(
        Q(start_date__lte=target_date) & Q(end_date__gte=target_date)
    ).select_related('hall', 'curator')

    context = {
        'target_date': target_date,
        'conflicts': conflicts,
        'unreturned_items': unreturned_items,
        'in_transit': in_transit,
        'borrow_orders_today': borrow_orders_today,
        'exhibitions': exhibitions,
    }

    return render(request, 'scheduling/day_detail.html', context)


@login_required
def notifications_view(request):
    notifications = Notification.objects.filter(user=request.user).order_by('-created_at')[:50]
    return render(request, 'scheduling/notifications.html', {'notifications': notifications})


@login_required
def mark_notification_read(request, notification_id):
    notification = get_object_or_404(Notification, id=notification_id, user=request.user)
    notification.mark_as_read()
    if request.is_ajax():
        return JsonResponse({'success': True})
    return redirect('notifications')


@login_required
def export_unreturned_excel(request):
    date_str = request.GET.get('date')
    if date_str:
        from datetime import datetime
        target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    else:
        target_date = timezone.now().date()

    output = ExportService.export_unreturned_list_to_excel(target_date)
    response = HttpResponse(
        output.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename=unreturned_{target_date}.xlsx'
    return response


@login_required
def export_inventory_excel(request):
    output = ExportService.export_inventory_to_excel()
    response = HttpResponse(
        output.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename=inventory.xlsx'
    return response


@login_required
def dashboard_redirect(request):
    return redirect('calendar')
