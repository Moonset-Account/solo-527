from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.db import transaction
from django.contrib import messages
from .models import Exhibition, BorrowOrder, BorrowItem, ExhibitionHall, ApprovalRecord
from .services import ApprovalService
from inventory.services import InventoryService
from inventory.models import Material
from inventory.exporters import ExportService
from users.decorators import (
    curator_required, warehouse_keeper_required,
    construction_lead_required, admin_required,
    can_create_borrow_order, can_manage_inventory,
    can_pickup_or_return, can_approve
)


@login_required
def exhibition_list(request):
    exhibitions = Exhibition.objects.select_related('hall', 'curator').all().order_by('-start_date')
    return render(request, 'exhibitions/exhibition_list.html', {'exhibitions': exhibitions})


@login_required
def exhibition_detail(request, pk):
    exhibition = get_object_or_404(Exhibition, pk=pk)
    borrow_orders = exhibition.borrow_orders.select_related('hall', 'requester').all()
    return render(request, 'exhibitions/exhibition_detail.html', {
        'exhibition': exhibition,
        'borrow_orders': borrow_orders,
    })


@login_required
def borrow_order_list(request):
    status = request.GET.get('status', '')
    orders = BorrowOrder.objects.select_related('exhibition', 'hall', 'requester')

    if status:
        orders = orders.filter(status=status)

    if not request.user.is_admin():
        if request.user.is_construction_lead():
            orders = orders.filter(
                status__in=[
                    BorrowOrder.APPROVED,
                    BorrowOrder.PICKED_UP,
                    BorrowOrder.PARTIAL_RETURNED,
                ]
            )
        elif request.user.is_curator():
            orders = orders.filter(requester=request.user)
        elif request.user.is_warehouse_keeper():
            orders = orders.filter(
                status__in=[
                    BorrowOrder.APPROVED,
                    BorrowOrder.PICKED_UP,
                    BorrowOrder.PARTIAL_RETURNED,
                    BorrowOrder.PENDING_APPROVAL,
                ]
            )

    orders = orders.order_by('-created_at')
    return render(request, 'exhibitions/borrow_order_list.html', {'orders': orders})


@login_required
def borrow_order_detail(request, pk):
    order = get_object_or_404(BorrowOrder, pk=pk)
    items = order.items.select_related('material', 'inventory_item').all()
    approval_records = order.approval_records.select_related('approver').all()
    transport_records = order.transport_records.all()
    return render(request, 'exhibitions/borrow_order_detail.html', {
        'order': order,
        'items': items,
        'approval_records': approval_records,
        'transport_records': transport_records,
    })


@login_required
@can_create_borrow_order
def borrow_order_create(request, exhibition_pk=None):
    exhibition = get_object_or_404(Exhibition, pk=exhibition_pk) if exhibition_pk else None

    if exhibition and exhibition.is_open():
        messages.error(request, '展览已开幕，仅可追加临时借用，不能创建普通借用单')
        return redirect('exhibition_detail', pk=exhibition_pk)

    if request.method == 'POST':
        hall_id = request.POST.get('hall')
        hall = get_object_or_404(ExhibitionHall, pk=hall_id)
        expected_pickup = request.POST.get('expected_pickup_date')
        expected_return = request.POST.get('expected_return_date')

        is_cross_hall = exhibition and hall != exhibition.hall

        order = BorrowOrder.objects.create(
            order_no=f'BO{timezone.now().strftime("%Y%m%d%H%M%S")}',
            exhibition=exhibition,
            hall=hall,
            requester=request.user,
            is_cross_hall=is_cross_hall,
            expected_pickup_date=expected_pickup,
            expected_return_date=expected_return,
            remarks=request.POST.get('remarks', ''),
        )

        material_ids = request.POST.getlist('material_ids[]')
        quantities = request.POST.getlist('quantities[]')

        for mat_id, qty in zip(material_ids, quantities):
            if mat_id and qty and int(qty) > 0:
                material = get_object_or_404(Material, pk=mat_id)
                BorrowItem.objects.create(
                    borrow_order=order,
                    material=material,
                    quantity=int(qty),
                )

        messages.success(request, '借用单创建成功')
        return redirect('borrow_order_detail', pk=order.pk)

    halls = ExhibitionHall.objects.filter(is_active=True)
    materials = Material.objects.all()
    return render(request, 'exhibitions/borrow_order_form.html', {
        'exhibition': exhibition,
        'halls': halls,
        'materials': materials,
    })


@login_required
@curator_required
def borrow_order_submit(request, pk):
    order = get_object_or_404(BorrowOrder, pk=pk)

    if order.status != BorrowOrder.DRAFT:
        messages.error(request, '只能提交草稿状态的借用单')
        return redirect('borrow_order_detail', pk=pk)

    try:
        ApprovalService.submit_for_approval(order)
        messages.success(request, '借用单已提交审批')
    except Exception as e:
        messages.error(request, f'提交失败: {str(e)}')

    return redirect('borrow_order_detail', pk=pk)


@login_required
@can_approve
def borrow_order_approve(request, pk):
    order = get_object_or_404(BorrowOrder, pk=pk)

    if request.method == 'POST':
        remarks = request.POST.get('remarks', '')
        action = request.POST.get('action')

        try:
            if action == 'approve':
                ApprovalService.approve_order(order, request.user, remarks)
                messages.success(request, '借用单已批准')
            elif action == 'reject':
                ApprovalService.reject_order(order, request.user, remarks)
                messages.success(request, '借用单已拒绝')
        except Exception as e:
            messages.error(request, f'操作失败: {str(e)}')

        return redirect('borrow_order_detail', pk=pk)

    return render(request, 'exhibitions/borrow_order_approve.html', {'order': order})


@login_required
@warehouse_keeper_required
def confirm_valuable_items(request, pk):
    order = get_object_or_404(BorrowOrder, pk=pk)

    if not order.has_valuable_items():
        messages.error(request, '此借用单不含贵重物品，无需双人确认')
        return redirect('borrow_order_detail', pk=pk)

    if request.method == 'POST':
        confirm_type = request.POST.get('confirm_type')
        try:
            ApprovalService.confirm_valuable_item(
                order,
                request.user,
                is_first=(confirm_type == 'first')
            )
            messages.success(request, '确认成功')
        except Exception as e:
            messages.error(request, f'确认失败: {str(e)}')

    return redirect('borrow_order_detail', pk=pk)


@login_required
@warehouse_keeper_required
def confirm_reservation(request, pk):
    order = get_object_or_404(BorrowOrder, pk=pk)

    if request.method == 'POST':
        try:
            InventoryService.confirm_reservation(order, request.user)
            messages.success(request, '库存预占确认成功')
        except Exception as e:
            messages.error(request, f'确认失败: {str(e)}')

    return redirect('borrow_order_detail', pk=pk)


@login_required
@can_pickup_or_return
def pickup_items(request, pk):
    order = get_object_or_404(BorrowOrder, pk=pk)

    if request.method == 'POST':
        try:
            InventoryService.pickup_items(order, request.user)
            messages.success(request, '物料领取成功')
        except Exception as e:
            messages.error(request, f'领取失败: {str(e)}')

    return redirect('borrow_order_detail', pk=pk)


@login_required
@can_pickup_or_return
def return_items(request, pk):
    order = get_object_or_404(BorrowOrder, pk=pk)

    if request.method == 'POST':
        try:
            items_data = {}
            item_ids = request.POST.getlist('item_ids[]')
            return_qtys = request.POST.getlist('return_qtys[]')

            for item_id, qty in zip(item_ids, return_qtys):
                if item_id and qty:
                    items_data[int(item_id)] = int(qty)

            InventoryService.return_items(order, request.user, items_data or None)
            messages.success(request, '物料归还成功')
        except Exception as e:
            messages.error(request, f'归还失败: {str(e)}')

    return redirect('borrow_order_detail', pk=pk)


@login_required
def create_temporary_borrow(request, exhibition_pk):
    exhibition = get_object_or_404(Exhibition, pk=exhibition_pk)

    if not exhibition.is_open():
        messages.error(request, '只有已开幕的展览才能追加临时借用')
        return redirect('exhibition_detail', pk=exhibition_pk)

    if request.method == 'POST':
        items_data = []
        material_ids = request.POST.getlist('material_ids[]')
        quantities = request.POST.getlist('quantities[]')

        for mat_id, qty in zip(material_ids, quantities):
            if mat_id and qty and int(qty) > 0:
                material = get_object_or_404(Material, pk=mat_id)
                items_data.append({
                    'material': material,
                    'quantity': int(qty),
                })

        hall_id = request.POST.get('hall')
        hall = get_object_or_404(ExhibitionHall, pk=hall_id) if hall_id else None

        try:
            order = ApprovalService.create_temporary_borrow(
                exhibition,
                request.user,
                items_data,
                hall
            )
            messages.success(request, '临时借用单创建成功')
            return redirect('borrow_order_detail', pk=order.pk)
        except Exception as e:
            messages.error(request, f'创建失败: {str(e)}')

    halls = ExhibitionHall.objects.filter(is_active=True)
    materials = Material.objects.all()
    return render(request, 'exhibitions/temporary_borrow_form.html', {
        'exhibition': exhibition,
        'halls': halls,
        'materials': materials,
    })


@login_required
def export_borrow_order_excel(request, pk):
    order = get_object_or_404(BorrowOrder, pk=pk)
    output = ExportService.export_borrow_order_to_excel(order)
    response = HttpResponse(
        output.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename=borrow_order_{order.order_no}.xlsx'
    return response


@login_required
def hall_list(request):
    halls = ExhibitionHall.objects.all()
    return render(request, 'exhibitions/hall_list.html', {'halls': halls})
