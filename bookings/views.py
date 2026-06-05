from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.contrib import messages
from django.http import JsonResponse
from django.utils import timezone

from .models import Booking
from .services import BookingService
from equipment.models import Equipment


@login_required
def booking_list(request):
    service = BookingService(request.user)
    bookings = service.get_all().order_by('-start_time')

    if not request.user.is_staff:
        bookings = bookings.filter(user=request.user)

    status = request.GET.get('status')
    equipment_id = request.GET.get('equipment')

    if status:
        bookings = bookings.filter(status=status)
    if equipment_id:
        bookings = bookings.filter(equipment_id=equipment_id)

    equipments = Equipment.objects.all()
    context = {
        'bookings': bookings,
        'equipments': equipments,
        'selected_status': status,
        'selected_equipment': equipment_id,
    }
    return render(request, 'bookings/list.html', context)


@login_required
def booking_calendar(request):
    service = BookingService(request.user)
    bookings = service.get_all().filter(
        status__in=['pending', 'approved', 'checked_in']
    )

    equipments = Equipment.objects.filter(status='available')
    context = {
        'bookings': bookings,
        'equipments': equipments,
    }
    return render(request, 'bookings/calendar.html', context)


@login_required
def booking_detail(request, pk):
    booking = get_object_or_404(Booking, pk=pk)
    context = {'booking': booking}
    return render(request, 'bookings/detail.html', context)


@login_required
@transaction.atomic
def booking_create(request):
    service = BookingService(request.user)

    if request.method == 'POST':
        try:
            equipment_id = request.POST.get('equipment')
            start_time = request.POST.get('start_time')
            end_time = request.POST.get('end_time')
            purpose = request.POST.get('purpose', '')

            equipment = get_object_or_404(Equipment, pk=equipment_id)

            data = {
                'user': request.user,
                'equipment': equipment,
                'start_time': start_time,
                'end_time': end_time,
                'purpose': purpose,
            }

            booking = service.create(data)
            messages.success(request, '预约已提交，等待审核')
            return redirect('bookings:detail', pk=booking.pk)
        except Exception as e:
            messages.error(request, str(e))

    equipments = Equipment.objects.filter(status='available')
    context = {'equipments': equipments}
    return render(request, 'bookings/create.html', context)


@login_required
@transaction.atomic
def booking_edit(request, pk):
    booking = get_object_or_404(Booking, pk=pk)
    service = BookingService(request.user)

    if request.method == 'POST':
        try:
            data = {
                'start_time': request.POST.get('start_time'),
                'end_time': request.POST.get('end_time'),
                'purpose': request.POST.get('purpose', ''),
            }
            service.update(booking, data)
            messages.success(request, '预约已更新')
            return redirect('bookings:detail', pk=pk)
        except Exception as e:
            messages.error(request, str(e))

    equipments = Equipment.objects.filter(status='available')
    context = {
        'booking': booking,
        'equipments': equipments,
    }
    return render(request, 'bookings/edit.html', context)


@login_required
@transaction.atomic
def booking_cancel(request, pk):
    booking = get_object_or_404(Booking, pk=pk)
    service = BookingService(request.user)

    if request.method == 'POST':
        try:
            reason = request.POST.get('reason', '')
            service.cancel(booking, request.user, reason)
            messages.success(request, '预约已取消')
        except Exception as e:
            messages.error(request, str(e))

    return redirect('bookings:detail', pk=pk)


@login_required
@transaction.atomic
def booking_approve(request, pk):
    booking = get_object_or_404(Booking, pk=pk)
    service = BookingService(request.user)

    if request.method == 'POST':
        try:
            notes = request.POST.get('notes', '')
            service.approve(booking, request.user, notes)
            messages.success(request, '预约已批准')
        except Exception as e:
            messages.error(request, str(e))

    return redirect('bookings:detail', pk=pk)


@login_required
@transaction.atomic
def booking_reject(request, pk):
    booking = get_object_or_404(Booking, pk=pk)
    service = BookingService(request.user)

    if request.method == 'POST':
        try:
            reason = request.POST.get('reason', '')
            service.reject(booking, request.user, reason)
            messages.success(request, '预约已拒绝')
        except Exception as e:
            messages.error(request, str(e))

    return redirect('bookings:detail', pk=pk)


@login_required
@transaction.atomic
def booking_check_in(request, pk):
    booking = get_object_or_404(Booking, pk=pk)
    service = BookingService(request.user)

    if request.method == 'POST':
        try:
            service.check_in(booking, request.user)
            messages.success(request, '已签到')
        except Exception as e:
            messages.error(request, str(e))

    return redirect('bookings:detail', pk=pk)


@login_required
@transaction.atomic
def booking_complete(request, pk):
    booking = get_object_or_404(Booking, pk=pk)
    service = BookingService(request.user)

    if request.method == 'POST':
        try:
            service.complete(booking, request.user)
            messages.success(request, '预约已完成')
        except Exception as e:
            messages.error(request, str(e))

    return redirect('bookings:detail', pk=pk)


@login_required
def my_bookings(request):
    service = BookingService(request.user)
    bookings = service.get_user_bookings(request.user).order_by('-start_time')
    context = {'bookings': bookings}
    return render(request, 'bookings/my_bookings.html', context)
