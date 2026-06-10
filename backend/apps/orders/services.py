from datetime import datetime, timedelta
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.inventory.services import InventoryService
from apps.orders.models import Order, OrderTimeline, Payment
from apps.properties.models import Room
from apps.reminders.models import Reminder, ReminderRule


class OrderService:
    @staticmethod
    def create_order(data, user=None):
        check_in = data['check_in_date']
        check_out = data['check_out_date']
        nights = (check_out - check_in).days
        room = Room.objects.get(id=data['room_id'])

        total_price = Decimal(0)
        current_date = check_in
        while current_date < check_out:
            from apps.inventory.models import Inventory, SpecialPricing
            inventory = Inventory.objects.filter(
                room_id=data['room_id'],
                date=current_date
            ).first()

            if inventory and inventory.price > 0:
                total_price += inventory.price
            else:
                special_pricing = SpecialPricing.objects.filter(
                    room_id=data['room_id'],
                    start_date__lte=current_date,
                    end_date__gte=current_date,
                    is_active=True
                ).first()
                total_price += special_pricing.price if special_pricing else room.base_price
            current_date += timedelta(days=1)

        with transaction.atomic():
            order = Order.objects.create(
                room_id=data['room_id'],
                check_in_date=check_in,
                check_out_date=check_out,
                nights=nights,
                adults=data.get('adults', 2),
                children=data.get('children', 0),
                guest_name=data['guest_name'],
                guest_phone=data['guest_phone'],
                guest_email=data.get('guest_email', ''),
                guest_remarks=data.get('guest_remarks', ''),
                base_amount=total_price,
                total_amount=total_price,
                source='direct',
                handled_by=user if user and user.is_authenticated else None,
            )

            InventoryService.lock_inventory(
                data['room_id'],
                check_in,
                check_out,
                f'订单锁定: {order.order_no}'
            )

            OrderService.add_timeline(order, '创建订单', f'订单已创建，订单号: {order.order_no}', user)

            OrderService._trigger_order_reminder(order, 'pending')

        return order

    @staticmethod
    def update_order_status(order, new_status, remarks='', user=None):
        old_status = order.status
        order.status = new_status

        with transaction.atomic():
            if new_status == 'confirmed' and old_status == 'pending':
                InventoryService.lock_inventory(
                    order.room_id,
                    order.check_in_date,
                    order.check_out_date,
                    f'订单确认: {order.order_no}'
                )
            elif new_status == 'checked_in':
                order.checked_in_at = timezone.now()
            elif new_status == 'checked_out':
                order.checked_out_at = timezone.now()
                order.conversion_stage = 'completed'
                InventoryService.unlock_inventory(
                    order.room_id,
                    order.check_in_date,
                    order.check_out_date
                )
            elif new_status == 'cancelled':
                order.cancelled_at = timezone.now()
                order.cancelled_reason = remarks
                InventoryService.unlock_inventory(
                    order.room_id,
                    order.check_in_date,
                    order.check_out_date
                )

            order.save()

            status_map = dict(Order.STATUS_CHOICES)
            OrderService.add_timeline(
                order,
                '状态变更',
                f'状态从 {status_map.get(old_status, old_status)} 变更为 {status_map.get(new_status, new_status)}。{remarks}',
                user
            )

            OrderService._trigger_order_reminder(order, new_status)

        return order

    @staticmethod
    def update_conversion_stage(order, stage, remarks='', user=None):
        old_stage = order.conversion_stage
        order.conversion_stage = stage
        order.save()

        stage_map = dict(Order.CONVERSION_STAGE_CHOICES)
        OrderService.add_timeline(
            order,
            '转化阶段变更',
            f'转化阶段从 {stage_map.get(old_stage, old_stage)} 变更为 {stage_map.get(stage, stage)}。{remarks}',
            user
        )

        return order

    @staticmethod
    def add_payment(order, amount, method, transaction_no='', remarks='', user=None):
        with transaction.atomic():
            payment = Payment.objects.create(
                order=order,
                amount=amount,
                method=method,
                transaction_no=transaction_no,
                remarks=remarks,
                operator=user if user and user.is_authenticated else None,
            )

            order.paid_amount += Decimal(str(amount))
            order.save()

            if order.is_paid and order.conversion_stage in ['quoted', 'deposit_paid']:
                order.conversion_stage = 'fully_paid'
                order.save()

            OrderService.add_timeline(
                order,
                '收款',
                f'收到 ¥{amount}，支付方式: {payment.get_method_display()}。{remarks}',
                user
            )

            if order.is_paid:
                OrderService._trigger_order_reminder(order, 'paid')

        return payment

    @staticmethod
    def add_timeline(order, action, description='', user=None):
        return OrderTimeline.objects.create(
            order=order,
            action=action,
            description=description,
            operator=user if user and user.is_authenticated else None,
        )

    @staticmethod
    def _trigger_order_reminder(order, event):
        try:
            rule = ReminderRule.objects.get(trigger_type='order_status', is_active=True)
        except ReminderRule.DoesNotExist:
            return

        level_map = {
            'pending': 2,
            'confirmed': 4,
            'paid': 4,
            'checked_in': 3,
            'checked_out': 4,
            'cancelled': 3,
        }

        title_map = {
            'pending': f'新订单待确认: {order.order_no}',
            'confirmed': f'订单已确认: {order.order_no}',
            'paid': f'订单已付款: {order.order_no}',
            'checked_in': f'客人已入住: {order.order_no}',
            'checked_out': f'客人已退房: {order.order_no}',
            'cancelled': f'订单已取消: {order.order_no}',
        }

        content_map = {
            'pending': f'订单 {order.order_no} 由 {order.guest_name} 预订，{order.check_in_date} 至 {order.check_out_date}，共 {order.nights} 晚。请在 30 分钟内确认。',
            'confirmed': f'订单 {order.order_no} 已确认，客人 {order.guest_name}，金额 ¥{order.total_amount}。',
            'paid': f'订单 {order.order_no} 已付款 ¥{order.paid_amount}，剩余 ¥{order.remaining_amount}。',
            'checked_in': f'客人 {order.guest_name} 已入住 {order.room.name}。',
            'checked_out': f'客人 {order.guest_name} 已退房，订单完成。',
            'cancelled': f'订单 {order.order_no} 已取消，原因: {order.cancelled_reason}。',
        }

        level = level_map.get(event, 3)
        Reminder.objects.create(
            rule=rule,
            level=level,
            title=title_map.get(event, '订单状态变更'),
            content=content_map.get(event, ''),
            related_type='order',
            related_id=order.id,
        )

    @staticmethod
    def get_conversion_funnel(start_date=None, end_date=None):
        stages = Order.CONVERSION_STAGE_CHOICES
        funnel = []
        total_inquiry = 0

        for stage_code, stage_name in stages:
            queryset = Order.objects.filter(conversion_stage=stage_code)
            if start_date:
                queryset = queryset.filter(created_at__date__gte=start_date)
            if end_date:
                queryset = queryset.filter(created_at__date__lte=end_date)

            count = queryset.count()
            amount = sum(o.total_amount for o in queryset) or 0

            if stage_code == 'inquiry':
                total_inquiry = count

            conversion_rate = (count / total_inquiry * 100) if total_inquiry > 0 else 0

            funnel.append({
                'stage': stage_code,
                'stage_display': stage_name,
                'count': count,
                'amount': amount,
                'conversion_rate': round(conversion_rate, 2)
            })

        return funnel
