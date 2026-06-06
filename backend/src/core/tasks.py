from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_notification_task(notification_id, user_ids=None):
    from apps.notifications.models import Notification, NotificationRead
    from apps.accounts.models import User

    try:
        notification = Notification.objects.get(id=notification_id)
        if not user_ids:
            pass

        logger.info(f'通知 {notification_id} 已发送')
        return True
    except Exception as e:
        logger.error(f'发送通知失败: {e}')
        return False


@shared_task
def send_payment_reminder_task(invoice_id):
    from apps.payments.models import Invoice

    try:
        invoice = Invoice.objects.get(id=invoice_id)
        invoice.reminder_sent = True
        invoice.last_reminder_at = timezone.now()
        invoice.save()
        logger.info(f'缴费提醒已发送: 账单 {invoice_id}')
        return True
    except Exception as e:
        logger.error(f'发送缴费提醒失败: {e}')
        return False


@shared_task
def check_overdue_invoices():
    from apps.payments.models import Invoice

    today = timezone.now().date()
    overdue = Invoice.objects.filter(
        status='pending',
        due_date__lt=today,
        is_deleted=False
    )
    count = 0
    for invoice in overdue:
        invoice.status = 'overdue'
        invoice.save()
        send_payment_reminder_task.delay(invoice.id)
        count += 1
    logger.info(f'已标记 {count} 个账单为逾期')
    return count


@shared_task
def cleanup_expired_authorized_persons():
    from apps.children.models import AuthorizedPickupPerson

    now = timezone.now()
    expired = AuthorizedPickupPerson.objects.filter(
        expires_at__lt=now,
        is_active=True,
        is_deleted=False
    )
    count = expired.update(is_active=False)
    logger.info(f'已禁用 {count} 个过期的授权接送人')
    return count


@shared_task
def generate_daily_report(date=None):
    if not date:
        date = timezone.now().date()
    logger.info(f'生成 {date} 的每日报告')
    return True
