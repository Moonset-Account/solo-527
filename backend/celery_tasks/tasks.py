from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from apps.inventory.services import InventoryService
from apps.orders.models import Order
from apps.reminders.models import Reminder, ReminderRule


@shared_task
def check_order_status():
    pending_orders = Order.objects.filter(status='pending', created_at__lte=timezone.now() - timedelta(minutes=30))
    for order in pending_orders:
        try:
            rule = ReminderRule.objects.get(trigger_type='order_status', is_active=True)
            Reminder.objects.create(
                rule=rule,
                level=2,
                title=f'订单超时未确认: {order.order_no}',
                content=f'订单 {order.order_no} 已创建超过 30 分钟仍未确认，请及时处理。',
                related_type='order',
                related_id=order.id,
            )
        except ReminderRule.DoesNotExist:
            pass


@shared_task
def check_inventory_conflicts():
    conflicts = InventoryService.detect_conflicts()
    for conflict in conflicts:
        try:
            rule = ReminderRule.objects.get(trigger_type='inventory_conflict', is_active=True)
            Reminder.objects.create(
                rule=rule,
                level=1,
                title=f'房态冲突: {conflict["date"]}',
                content=conflict['message'],
                related_type='inventory',
                related_id=conflict['room_id'],
            )
        except ReminderRule.DoesNotExist:
            pass


@shared_task
def send_checkin_reminders():
    tomorrow = timezone.now().date() + timedelta(days=1)
    checking_in_orders = Order.objects.filter(
        status='confirmed',
        check_in_date=tomorrow
    )

    for order in checking_in_orders:
        try:
            rule = ReminderRule.objects.get(trigger_type='checkin_reminder', is_active=True)
            Reminder.objects.create(
                rule=rule,
                level=3,
                title=f'明日入住提醒: {order.order_no}',
                content=f'客人 {order.guest_name} 将于明日入住 {order.room_name}，请做好准备。联系电话: {order.guest_phone}',
                related_type='order',
                related_id=order.id,
            )
        except ReminderRule.DoesNotExist:
            pass


@shared_task
def check_overdue_reminders():
    pending_reminders = Reminder.objects.filter(status='pending')
    for reminder in pending_reminders:
        if reminder.is_overdue and not reminder.escalated and reminder.level > 1:
            reminder.original_level = reminder.level
            reminder.level = reminder.level - 1
            reminder.escalated = True
            reminder.color = ReminderRule.LEVEL_COLORS.get(reminder.level, '#E53935')
            reminder.title = f'[超时] {reminder.title}'
            reminder.save()


@shared_task
def send_sms_reminder(phone, message):
    pass


@shared_task
def send_email_reminder(email, subject, message):
    pass
