from datetime import date, timedelta
from django.db.models import Q
from django.utils import timezone
from .models import ScheduleConflict, DailySchedule, Notification
from exhibitions.models import Exhibition, BorrowOrder, BorrowItem
from inventory.models import InventoryReservation, InventoryItem


class ConflictDetectionService:
    @staticmethod
    def detect_exhibition_conflicts(exhibition):
        conflicts = []

        overlapping_exhibitions = Exhibition.objects.filter(
            hall=exhibition.hall,
            status__in=[Exhibition.PLANNING, Exhibition.INSTALLATION, Exhibition.OPEN],
            start_date__lte=exhibition.end_date,
            end_date__gte=exhibition.start_date
        ).exclude(id=exhibition.id)

        for overlap in overlapping_exhibitions:
            conflict = ScheduleConflict.objects.create(
                type=ScheduleConflict.HALL_CONFLICT,
                severity=ScheduleConflict.HIGH,
                exhibition=exhibition,
                conflicting_exhibition=overlap,
                conflict_date=max(exhibition.start_date, overlap.start_date),
                description=f'展厅 {exhibition.hall.name} 时间冲突：{exhibition.name} 与 {overlap.name} 时间重叠'
            )
            conflicts.append(conflict)

        return conflicts

    @staticmethod
    def detect_material_conflicts(borrow_order):
        conflicts = []

        for borrow_item in borrow_order.items.all():
            material = borrow_item.material

            overlapping_reservations = InventoryReservation.objects.filter(
                inventory_item__material=material,
                status__in=[InventoryReservation.PENDING, InventoryReservation.CONFIRMED],
                start_date__lte=borrow_order.expected_return_date,
                end_date__gte=borrow_order.expected_pickup_date
            ).exclude(
                Q(exhibition=borrow_order.exhibition) |
                Q(exhibition__borrow_orders=borrow_order)
            )

            if overlapping_reservations.exists():
                conflict = ScheduleConflict.objects.create(
                    type=ScheduleConflict.MATERIAL_CONFLICT,
                    severity=ScheduleConflict.CRITICAL if material.is_valuable else ScheduleConflict.HIGH,
                    exhibition=borrow_order.exhibition,
                    borrow_order=borrow_order,
                    material=material,
                    conflict_date=borrow_order.expected_pickup_date,
                    description=f'物料 {material.name} 预占冲突，已被其他展览预占'
                )
                conflicts.append(conflict)

            overlapping_borrows = BorrowItem.objects.filter(
                material=material,
                status__in=[BorrowItem.PICKED_UP, BorrowItem.PENDING],
                borrow_order__expected_return_date__gte=borrow_order.expected_pickup_date,
                borrow_order__expected_pickup_date__lte=borrow_order.expected_return_date
            ).exclude(borrow_order=borrow_order)

            if overlapping_borrows.exists():
                conflict = ScheduleConflict.objects.create(
                    type=ScheduleConflict.MATERIAL_CONFLICT,
                    severity=ScheduleConflict.CRITICAL if material.is_valuable else ScheduleConflict.HIGH,
                    exhibition=borrow_order.exhibition,
                    borrow_order=borrow_order,
                    conflicting_borrow_order=overlapping_borrows.first().borrow_order,
                    material=material,
                    conflict_date=borrow_order.expected_pickup_date,
                    description=f'物料 {material.name} 借用冲突，已被其他借用单使用'
                )
                conflicts.append(conflict)

        return conflicts

    @staticmethod
    def get_day_conflicts(target_date):
        return ScheduleConflict.objects.filter(
            conflict_date=target_date,
            is_resolved=False
        ).select_related('exhibition', 'borrow_order', 'material')

    @staticmethod
    def resolve_conflict(conflict_id, resolved_by, notes=''):
        conflict = ScheduleConflict.objects.get(id=conflict_id)
        conflict.is_resolved = True
        conflict.resolved_by = resolved_by
        conflict.resolved_at = timezone.now()
        conflict.resolution_notes = notes
        conflict.save()
        return conflict


class NotificationService:
    @staticmethod
    def create_notification(user, type, title, message, exhibition=None, borrow_order=None):
        return Notification.objects.create(
            user=user,
            type=type,
            title=title,
            message=message,
            related_exhibition=exhibition,
            related_borrow_order=borrow_order
        )

    @staticmethod
    def notify_approval_needed(borrow_order):
        from users.models import Role, User

        admins = User.objects.filter(
            Q(role__name=Role.ADMIN) | Q(is_superuser=True)
        )

        for admin in admins:
            NotificationService.create_notification(
                user=admin,
                type=Notification.WARNING,
                title='借用单待审批',
                message=f'借用单 {borrow_order.order_no} 需要您的审批',
                borrow_order=borrow_order
            )

    @staticmethod
    def notify_overdue_borrows():
        today = timezone.now().date()
        overdue_orders = BorrowOrder.objects.filter(
            status__in=[BorrowOrder.PICKED_UP, BorrowOrder.PARTIAL_RETURNED],
            expected_return_date__lt=today
        ).select_related('exhibition', 'requester', 'construction_lead')

        for order in overdue_orders:
            if order.requester:
                NotificationService.create_notification(
                    user=order.requester,
                    type=Notification.ERROR,
                    title='借用单已逾期',
                    message=f'借用单 {order.order_no} 已超过预计归还日期，请尽快归还',
                    borrow_order=order
                )
            if order.construction_lead:
                NotificationService.create_notification(
                    user=order.construction_lead,
                    type=Notification.ERROR,
                    title='借用单已逾期',
                    message=f'借用单 {order.order_no} 已超过预计归还日期，请尽快归还',
                    borrow_order=order
                )

    @staticmethod
    def notify_upcoming_pickups(days=1):
        target_date = timezone.now().date() + timedelta(days=days)
        upcoming_orders = BorrowOrder.objects.filter(
            status=BorrowOrder.APPROVED,
            expected_pickup_date=target_date
        ).select_related('exhibition', 'requester', 'construction_lead')

        for order in upcoming_orders:
            if order.construction_lead:
                NotificationService.create_notification(
                    user=order.construction_lead,
                    type=Notification.INFO,
                    title='物料即将领取',
                    message=f'借用单 {order.order_no} 预计明天领取，请做好准备',
                    borrow_order=order
                )
