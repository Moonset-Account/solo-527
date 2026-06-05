from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.db import transaction
from django.contrib import messages

from .models import Equipment, EquipmentCategory, EquipmentUsageLog
from .services import EquipmentService, EquipmentCategoryService, EquipmentUsageLogService
from core.permissions import has_permission


@login_required
def equipment_list(request):
    service = EquipmentService(request.user)
    categories = EquipmentCategory.objects.all()

    category_id = request.GET.get('category')
    status = request.GET.get('status')

    queryset = Equipment.objects.all()
    if category_id:
        queryset = queryset.filter(category_id=category_id)
    if status:
        queryset = queryset.filter(status=status)
    equipments = list(queryset)

    context = {
        'equipments': equipments,
        'categories': categories,
        'selected_category': category_id,
        'selected_status': status,
    }
    return render(request, 'equipment/list.html', context)


@login_required
def equipment_detail(request, pk):
    equipment = get_object_or_404(Equipment, pk=pk)
    usage_logs = EquipmentUsageLog.objects.filter(equipment=equipment).order_by('-start_time')[:10]

    context = {
        'equipment': equipment,
        'usage_logs': usage_logs,
    }
    return render(request, 'equipment/detail.html', context)


@login_required
def equipment_book(request, pk):
    equipment = get_object_or_404(Equipment, pk=pk)
    return redirect('bookings:create')


@login_required
@transaction.atomic
def start_usage(request, pk):
    equipment = get_object_or_404(Equipment, pk=pk)
    service = EquipmentService(request.user)

    if request.method == 'POST':
        try:
            notes = request.POST.get('notes', '')
            usage_log = service.start_usage(equipment, request.user, notes)
            messages.success(request, '设备使用已开始')
            return redirect('equipment:detail', pk=pk)
        except Exception as e:
            messages.error(request, str(e))

    return redirect('equipment:detail', pk=pk)


@login_required
@transaction.atomic
def end_usage(request, pk, usage_id):
    equipment = get_object_or_404(Equipment, pk=pk)
    usage_log = get_object_or_404(EquipmentUsageLog, pk=usage_id)
    service = EquipmentService(request.user)

    if request.method == 'POST':
        try:
            service.end_usage(usage_log, request.user)
            messages.success(request, '设备使用已结束')
            return redirect('equipment:detail', pk=pk)
        except Exception as e:
            messages.error(request, str(e))

    return redirect('equipment:detail', pk=pk)


@login_required
def category_list(request):
    service = EquipmentCategoryService(request.user)
    categories = service.get_all()
    context = {'categories': categories}
    return render(request, 'equipment/category_list.html', context)


@login_required
def category_detail(request, pk):
    category = get_object_or_404(EquipmentCategory, pk=pk)
    equipments = Equipment.objects.filter(category=category)
    context = {
        'category': category,
        'equipments': equipments,
    }
    return render(request, 'equipment/category_detail.html', context)
