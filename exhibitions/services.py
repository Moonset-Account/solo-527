from django.utils import timezone
from django.db import transaction
from .models import BorrowOrder, BorrowItem, ApprovalRecord
from inventory.services import InventoryService
from scheduling.services import NotificationService


class ApprovalService:
    @staticmethod
    def needs_approval(borrow_order):
        if borrow_order.is_cross_hall:
            return True
        if borrow_order.has_valuable_items():
            return True
        return False

    @staticmethod
    @transaction.atomic
    def submit_for_approval(borrow_order):
        borrow_order.requires_approval = ApprovalService.needs_approval(borrow_order)

        if borrow_order.requires_approval:
            borrow_order.status = BorrowOrder.PENDING_APPROVAL
            borrow_order.save()
            NotificationService.notify_approval_needed(borrow_order)
        else:
            borrow_order.status = BorrowOrder.APPROVED
            borrow_order.save()
            try:
                InventoryService.reserve_inventory(borrow_order, confirmed_by=None)
            except Exception as e:
                borrow_order.status = BorrowOrder.DRAFT
                borrow_order.save()
                raise ValueError(f'库存预占失败: {str(e)}')

        return borrow_order

    @staticmethod
    @transaction.atomic
    def approve_order(borrow_order, approver, remarks=''):
        if borrow_order.status != BorrowOrder.PENDING_APPROVAL:
            raise ValueError('借用单状态不正确，无法审批')

        approval = ApprovalRecord.objects.create(
            borrow_order=borrow_order,
            approver=approver,
            action=ApprovalRecord.APPROVE,
            remarks=remarks
        )

        borrow_order.approver = approver
        borrow_order.approval_time = timezone.now()
        borrow_order.approval_remarks = remarks
        borrow_order.status = BorrowOrder.APPROVED
        borrow_order.save()

        try:
            InventoryService.reserve_inventory(borrow_order, confirmed_by=None)
        except Exception as e:
            raise ValueError(f'库存预占失败: {str(e)}')

        if borrow_order.requester:
            NotificationService.create_notification(
                user=borrow_order.requester,
                type='success',
                title='借用单已批准',
                message=f'您的借用单 {borrow_order.order_no} 已被批准，库存已预占',
                borrow_order=borrow_order
            )

        return approval

    @staticmethod
    @transaction.atomic
    def reject_order(borrow_order, approver, remarks=''):
        if borrow_order.status != BorrowOrder.PENDING_APPROVAL:
            raise ValueError('借用单状态不正确，无法审批')

        approval = ApprovalRecord.objects.create(
            borrow_order=borrow_order,
            approver=approver,
            action=ApprovalRecord.REJECT,
            remarks=remarks
        )

        borrow_order.status = BorrowOrder.CANCELLED
        borrow_order.approver = approver
        borrow_order.approval_time = timezone.now()
        borrow_order.approval_remarks = remarks
        borrow_order.save()

        if borrow_order.requester:
            NotificationService.create_notification(
                user=borrow_order.requester,
                type='error',
                title='借用单被拒绝',
                message=f'您的借用单 {borrow_order.order_no} 被拒绝：{remarks}',
                borrow_order=borrow_order
            )

        return approval

    @staticmethod
    @transaction.atomic
    def confirm_valuable_item(borrow_order, confirmer, is_first=True):
        if not borrow_order.has_valuable_items():
            raise ValueError('此借用单不包含贵重物品')

        if borrow_order.is_double_confirmed():
            raise ValueError('贵重物品已完成双人确认')

        now = timezone.now()

        if is_first:
            if borrow_order.first_confirmer:
                raise ValueError('第一确认人已确认')
            borrow_order.first_confirmer = confirmer
            borrow_order.first_confirm_time = now
        else:
            if not borrow_order.first_confirmer:
                raise ValueError('请先完成第一确认')
            if borrow_order.second_confirmer:
                raise ValueError('第二确认人已确认')
            if borrow_order.first_confirmer_id == confirmer.id:
                raise ValueError('同一账号不能进行两次确认，请由不同人员完成第二确认')
            borrow_order.second_confirmer = confirmer
            borrow_order.second_confirm_time = now

        borrow_order.save()
        return borrow_order

    @staticmethod
    @transaction.atomic
    def create_temporary_borrow(exhibition, requester, items_data, hall=None):
        if not exhibition.is_open():
            raise ValueError('只有已开幕的展览才能追加临时借用')

        from datetime import timedelta
        from django.utils import timezone

        borrow_order = BorrowOrder.objects.create(
            order_no=f'TMP{timezone.now().strftime("%Y%m%d%H%M%S")}',
            exhibition=exhibition,
            hall=hall or exhibition.hall,
            type=BorrowOrder.TEMPORARY,
            requester=requester,
            status=BorrowOrder.DRAFT,
            is_cross_hall=hall is not None and hall != exhibition.hall,
            expected_pickup_date=timezone.now().date(),
            expected_return_date=timezone.now().date() + timedelta(days=7)
        )

        for item_data in items_data:
            BorrowItem.objects.create(
                borrow_order=borrow_order,
                material=item_data['material'],
                quantity=item_data['quantity']
            )

        return borrow_order
