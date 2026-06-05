from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.contrib import messages

from .models import Consumable, ConsumableCategory, ConsumableUsage, ConsumableRestock
from .services import ConsumableService, ConsumableUsageService, ConsumableRestockService


@login_required
def consumable_list(request):
    consumables = Consumable.objects.all()

    category_id = request.GET.get('category')
    low_stock = request.GET.get('low_stock')

    if category_id:
        consumables = consumables.filter(category_id=category_id)
    if low_stock:
        from django.db.models import F
        consumables = consumables.filter(current_stock__lte=F('min_stock'))

    categories = ConsumableCategory.objects.all()
    context = {
        'consumables': consumables,
        'categories': categories,
        'selected_category': category_id,
        'low_stock': low_stock,
    }
    return render(request, 'consumables/list.html', context)


@login_required
def consumable_detail(request, pk):
    consumable = get_object_or_404(Consumable, pk=pk)
    usage_records = ConsumableUsage.objects.filter(consumable=consumable).order_by('-created_at')[:20]
    stock_records = ConsumableRestock.objects.filter(consumable=consumable).order_by('-created_at')[:20]
    context = {
        'consumable': consumable,
        'usage_records': usage_records,
        'stock_records': stock_records,
    }
    return render(request, 'consumables/detail.html', context)


@login_required
@transaction.atomic
def use_consumable(request, pk):
    consumable = get_object_or_404(Consumable, pk=pk)
    service = ConsumableUsageService(request.user)

    if request.method == 'POST':
        try:
            quantity = int(request.POST.get('quantity', 1))
            booking_id = request.POST.get('booking')
            booking = None
            if booking_id:
                from bookings.models import Booking
                booking = get_object_or_404(Booking, pk=booking_id)
            notes = request.POST.get('notes', '')

            usage_record = service.record_usage(
                consumable=consumable,
                user=request.user,
                quantity=quantity,
                booking=booking,
                notes=notes,
            )
            messages.success(request, f'已成功领用 {quantity} {consumable.unit} {consumable.name}')
            return redirect('consumables:list')
        except Exception as e:
            messages.error(request, str(e))
            return redirect('consumables:list')

    return redirect('consumables:list')


@login_required
@transaction.atomic
def restock_consumable(request, pk):
    consumable = get_object_or_404(Consumable, pk=pk)
    service = ConsumableRestockService(request.user)

    if request.method == 'POST':
        try:
            quantity = int(request.POST.get('quantity', 1))
            supplier = request.POST.get('supplier', '')
            batch_number = request.POST.get('batch_number', '')
            unit_cost = float(request.POST.get('unit_cost', 0))

            data = {
                'consumable': consumable,
                'quantity': quantity,
                'supplier': supplier,
                'batch_number': batch_number,
                'unit_cost': unit_cost,
                'stocked_by': request.user,
            }

            stock_record = service.create(data, user=request.user)
            messages.success(request, f'已入库 {quantity} 个耗材')
            return redirect('consumables:detail', pk=pk)
        except Exception as e:
            messages.error(request, str(e))

    return redirect('consumables:detail', pk=pk)


@login_required
def usage_list(request):
    usage_records = ConsumableUsage.objects.all().order_by('-created_at')

    billed = request.GET.get('billed')
    if billed is not None:
        usage_records = usage_records.filter(is_billed=(billed == '1'))

    context = {'usage_records': usage_records}
    return render(request, 'consumables/usage_list.html', context)


@login_required
@transaction.atomic
def mark_usage_billed(request, pk):
    usage_record = get_object_or_404(ConsumableUsage, pk=pk)
    service = ConsumableUsageService(request.user)

    if request.method == 'POST':
        try:
            service.mark_as_billed(usage_record, request.user)
            messages.success(request, '已标记为已计费')
        except Exception as e:
            messages.error(request, str(e))

    return redirect('consumables:usage_list')


@login_required
def low_stock_alert(request):
    service = ConsumableService(request.user)
    all_consumables = service.get_all()
    low_stock_items = [c for c in all_consumables if c.is_low_stock]
    context = {'low_stock_items': low_stock_items}
    return render(request, 'consumables/low_stock.html', context)
