from celery import shared_task
from django.utils import timezone
from django.conf import settings
from django.db.models import Q
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_notification_task(self, notification_id, user_ids=None):
    from apps.notifications.models import Notification, UserNotification
    from apps.users.models import User

    try:
        notification = Notification.objects.get(id=notification_id)
        if user_ids:
            users = User.objects.filter(id__in=user_ids, is_active=True)
        else:
            users = User.objects.filter(is_active=True)

        created = 0
        for user in users:
            _, flag = UserNotification.objects.get_or_create(
                notification=notification, user=user
            )
            if flag:
                created += 1

        logger.info(f'Notification {notification_id} sent to {created} users')
        return {'sent': created}
    except Exception as exc:
        logger.error(f'Failed to send notification: {exc}')
        raise self.retry(exc=exc, countdown=60)


@shared_task
def push_repair_status_update(repair_id, old_status, new_status):
    from apps.notifications.models import Notification, NotificationType, UserNotification
    from apps.repairs.models import RepairRequest, RepairStatus

    try:
        repair = RepairRequest.objects.select_related('applicant', 'assignee').get(id=repair_id)
        status_map = dict(RepairStatus.choices)
        title = f'报修状态更新: {repair.title}'
        content = f'您的报修申请状态已从【{status_map.get(old_status, old_status)}】变更为【{status_map.get(new_status, new_status)}】。'

        notification = Notification.objects.create(
            title=title,
            content=content,
            type=NotificationType.REPAIR_STATUS,
            repair_request=repair
        )

        recipients = [repair.applicant]
        if repair.assignee:
            recipients.append(repair.assignee)
        for user in recipients:
            UserNotification.objects.get_or_create(notification=notification, user=user)

        logger.info(f'Repair {repair_id} status update pushed')
    except Exception as e:
        logger.error(f'Failed to push repair status: {e}')


@shared_task
def auto_check_no_show_reservations():
    from apps.rooms.models import SeatReservation
    from django.utils import timezone

    now = timezone.now()
    today = now.date()
    current_time = now.time()

    no_show = SeatReservation.objects.filter(
        date=today,
        status='reserved',
        end_time__lt=current_time
    )
    updated = no_show.update(status='no_show')
    if updated:
        logger.info(f'Marked {updated} reservations as no_show')
    return updated


@shared_task
def clean_expired_announcements():
    from apps.notifications.models import Announcement
    from django.utils import timezone

    now = timezone.now()
    expired = Announcement.objects.filter(is_published=True, expires_at__isnull=False, expires_at__lt=now)
    count = expired.update(is_published=False)
    if count:
        logger.info(f'Unpublished {count} expired announcements')
    return count


@shared_task
def send_daily_repair_summary():
    from apps.repairs.models import RepairRequest, RepairStatus
    from apps.users.models import User, Role
    from django.db.models import Count
    from django.utils import timezone
    from datetime import timedelta

    yesterday = timezone.now() - timedelta(days=1)
    stats = RepairRequest.objects.filter(created_at__gte=yesterday).aggregate(
        total=Count('id'),
        pending=Count('id', filter=Q(status=RepairStatus.PENDING)),
        completed=Count('id', filter=Q(status=RepairStatus.COMPLETED))
    )

    logger.info(f'Daily repair summary: {stats}')
    return stats
