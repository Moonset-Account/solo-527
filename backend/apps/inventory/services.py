from datetime import date, datetime, timedelta

from django.db import transaction
from django.utils import timezone

from apps.inventory.models import Inventory, InventoryConflict, SpecialPricing
from apps.properties.models import Room
from apps.reminders.models import Reminder, ReminderRule


class InventoryService:
    @staticmethod
    def get_calendar_data(room_id, start_date, end_date):
        inventory_items = Inventory.objects.filter(
            room_id=room_id,
            date__gte=start_date,
            date__lte=end_date
        ).order_by('date')

        date_map = {item.date: item for item in inventory_items}
        room = Room.objects.get(id=room_id)
        result = []
        current_date = start_date

        while current_date <= end_date:
            if current_date in date_map:
                item = date_map[current_date]
                result.append({
                    'date': item.date.isoformat(),
                    'status': item.status,
                    'status_display': item.get_status_display(),
                    'price': float(item.price),
                    'is_locked': item.is_locked,
                    'room_id': str(room_id),
                })
            else:
                special_pricing = SpecialPricing.objects.filter(
                    room_id=room_id,
                    start_date__lte=current_date,
                    end_date__gte=current_date,
                    is_active=True
                ).first()

                price = special_pricing.price if special_pricing else room.base_price
                result.append({
                    'date': current_date.isoformat(),
                    'status': 'available',
                    'status_display': '可订',
                    'price': float(price),
                    'is_locked': False,
                    'room_id': str(room_id),
                })
            current_date += timedelta(days=1)

        return result

    @staticmethod
    def check_availability(room_id, check_in_date, check_out_date):
        nights = (check_out_date - check_in_date).days
        if nights <= 0:
            return {'available': False, 'reason': '无效的日期范围', 'total_price': 0}

        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return {'available': False, 'reason': '房型不存在', 'total_price': 0}

        inventory_items = Inventory.objects.filter(
            room_id=room_id,
            date__gte=check_in_date,
            date__lt=check_out_date
        )
        inventory_map = {item.date: item for item in inventory_items}

        special_pricings = SpecialPricing.objects.filter(
            room_id=room_id,
            start_date__lt=check_out_date,
            end_date__gte=check_in_date,
            is_active=True
        )

        def get_special_price(d):
            for sp in special_pricings:
                if sp.start_date <= d <= sp.end_date:
                    return float(sp.price)
            return None

        total_price = 0.0
        current_date = check_in_date
        while current_date < check_out_date:
            if current_date in inventory_map:
                item = inventory_map[current_date]
                if item.status != 'available' or item.is_locked:
                    return {
                        'available': False,
                        'reason': f'{current_date.isoformat()} 不可预订（{item.get_status_display()}）',
                        'conflict_date': current_date.isoformat(),
                        'total_price': 0
                    }
                day_price = float(item.price) if item.price else None
                if day_price is None or day_price == 0:
                    day_price = get_special_price(current_date) or float(room.base_price)
                total_price += day_price
            else:
                day_price = get_special_price(current_date) or float(room.base_price)
                total_price += day_price
            current_date += timedelta(days=1)

        return {'available': True, 'nights': nights, 'total_price': total_price}

    @staticmethod
    def batch_update(room_id, start_date, end_date, status=None, price=None, is_locked=None):
        conflicts = []
        updated_items = []

        with transaction.atomic():
            current_date = start_date
            while current_date <= end_date:
                inventory, created = Inventory.objects.get_or_create(
                    room_id=room_id,
                    date=current_date,
                    defaults={'status': status or 'available', 'price': price or 0}
                )

                if not created:
                    old_status = inventory.status
                    old_price = inventory.price

                    if status and inventory.status != status:
                        if status == 'available' and old_status == 'booked':
                            conflicts.append({
                                'date': current_date,
                                'type': 'status_overlap',
                                'message': f'{current_date.isoformat()} 正在被预订中，状态变更需要确认'
                            })
                        inventory.status = status

                    if price is not None:
                        inventory.price = price

                    if is_locked is not None:
                        inventory.is_locked = is_locked

                    inventory.save()
                    updated_items.append(inventory)
                else:
                    updated_items.append(inventory)

                current_date += timedelta(days=1)

            if conflicts:
                InventoryService._create_conflicts(room_id, conflicts)
                InventoryService._trigger_conflict_reminders(room_id, conflicts)

        return updated_items, conflicts

    @staticmethod
    def _create_conflicts(room_id, conflicts):
        for conflict in conflicts:
            InventoryConflict.objects.create(
                room_id=room_id,
                date=conflict['date'],
                conflict_type=conflict.get('type', 'status_overlap'),
                severity=1,
                description=conflict['message']
            )

    @staticmethod
    def _trigger_conflict_reminders(room_id, conflicts):
        try:
            rule = ReminderRule.objects.get(trigger_type='inventory_conflict', is_active=True)
        except ReminderRule.DoesNotExist:
            return

        for conflict in conflicts:
            Reminder.objects.create(
                rule=rule,
                level=rule.level,
                color=rule.color,
                title=f'房态冲突：{conflict["date"]}',
                content=conflict['message'],
                related_type='inventory',
                related_id=room_id,
            )

    @staticmethod
    def lock_inventory(room_id, check_in_date, check_out_date, locked_by='订单锁定'):
        with transaction.atomic():
            current_date = check_in_date
            while current_date < check_out_date:
                inventory, _ = Inventory.objects.get_or_create(
                    room_id=room_id,
                    date=current_date,
                    defaults={'status': 'booked', 'is_locked': True, 'locked_by': locked_by}
                )
                if not inventory.is_locked:
                    inventory.status = 'booked'
                    inventory.is_locked = True
                    inventory.locked_by = locked_by
                    inventory.save()
                current_date += timedelta(days=1)

    @staticmethod
    def unlock_inventory(room_id, check_in_date, check_out_date):
        with transaction.atomic():
            Inventory.objects.filter(
                room_id=room_id,
                date__gte=check_in_date,
                date__lt=check_out_date
            ).update(
                status='available',
                is_locked=False,
                locked_by=''
            )

    @staticmethod
    def detect_conflicts():
        from apps.orders.models import Order
        conflicts = []

        pending_orders = Order.objects.filter(status__in=['pending', 'confirmed'])
        for order in pending_orders:
            inventory_items = Inventory.objects.filter(
                room_id=order.room_id,
                date__gte=order.check_in_date,
                date__lt=order.check_out_date
            )

            for item in inventory_items:
                if item.status != 'booked' or not item.is_locked:
                    conflicts.append({
                        'order_id': order.id,
                        'order_no': order.order_no,
                        'room_id': order.room_id,
                        'date': item.date,
                        'type': 'double_booking',
                        'message': f'订单 {order.order_no} 的房态未正确锁定'
                    })

        return conflicts
