from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q, Count
from .models import Material, MaterialCategory, InventoryItem, Warehouse, InventoryReservation
from .services import InventoryService
from users.decorators import warehouse_keeper_required, can_manage_inventory


@login_required
def material_list(request):
    category = request.GET.get('category', '')
    material_type = request.GET.get('type', '')
    search = request.GET.get('search', '')

    materials = Material.objects.select_related('category').annotate(
        total_items=Count('inventory_items')
    )

    if category:
        materials = materials.filter(category_id=category)
    if material_type:
        materials = materials.filter(type=material_type)
    if search:
        materials = materials.filter(
            Q(name__icontains=search) |
            Q(code__icontains=search) |
            Q(specification__icontains=search)
        )

    categories = MaterialCategory.objects.all()
    return render(request, 'inventory/material_list.html', {
        'materials': materials,
        'categories': categories,
    })


@login_required
def material_detail(request, pk):
    material = get_object_or_404(Material, pk=pk)
    inventory_items = material.inventory_items.select_related('warehouse').all()

    start_date = request.GET.get('start_date', '')
    end_date = request.GET.get('end_date', '')

    available_qty = None
    if start_date and end_date:
        from datetime import datetime
        start = datetime.strptime(start_date, '%Y-%m-%d').date()
        end = datetime.strptime(end_date, '%Y-%m-%d').date()
        available_qty = InventoryService.check_availability(material, start, end)

    return render(request, 'inventory/material_detail.html', {
        'material': material,
        'inventory_items': inventory_items,
        'available_qty': available_qty,
    })


@login_required
def inventory_list(request):
    status = request.GET.get('status', '')
    warehouse = request.GET.get('warehouse', '')
    search = request.GET.get('search', '')

    items = InventoryItem.objects.select_related('material', 'warehouse')

    if status:
        items = items.filter(status=status)
    if warehouse:
        items = items.filter(warehouse_id=warehouse)
    if search:
        items = items.filter(
            Q(serial_number__icontains=search) |
            Q(material__name__icontains=search) |
            Q(material__code__icontains=search)
        )

    warehouses = Warehouse.objects.all()
    return render(request, 'inventory/inventory_list.html', {
        'items': items,
        'warehouses': warehouses,
    })


@login_required
def warehouse_list(request):
    warehouses = Warehouse.objects.select_related('manager').all()
    return render(request, 'inventory/warehouse_list.html', {'warehouses': warehouses})


@login_required
def reservation_list(request):
    status = request.GET.get('status', '')
    reservations = InventoryReservation.objects.select_related(
        'inventory_item', 'inventory_item__material', 'exhibition', 'requested_by'
    )

    if status:
        reservations = reservations.filter(status=status)

    return render(request, 'inventory/reservation_list.html', {'reservations': reservations})


@login_required
@warehouse_keeper_required
def confirm_reservation(request, pk):
    reservation = get_object_or_404(InventoryReservation, pk=pk)

    if request.method == 'POST':
        reservation.status = InventoryReservation.CONFIRMED
        reservation.confirmed_by = request.user
        reservation.save()
        messages.success(request, '预占已确认')

    return redirect('reservation_list')


@login_required
@warehouse_keeper_required
def cancel_reservation(request, pk):
    reservation = get_object_or_404(InventoryReservation, pk=pk)

    if request.method == 'POST':
        InventoryService.release_reservation(reservation)
        messages.success(request, '预占已取消')

    return redirect('reservation_list')
