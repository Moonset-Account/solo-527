from celery import shared_task
from django.utils import timezone
from django.conf import settings
from django.db.models import Q
from datetime import timedelta
from apps.borrowing.models import BorrowRecord, BorrowStatus
from apps.activities.models import Activity, ActivityRegistration, RegistrationStatus, ActivityWaitlistNotification
import logging

logger = logging.getLogger(__name__)


@shared_task
def check_overdue_books():
    today = timezone.now().date()
    overdue_records = BorrowRecord.objects.filter(
        status__in=[BorrowStatus.BORROWED, BorrowStatus.OVERDUE],
        due_date__lt=today,
        is_deleted=False
    )
    
    updated_count = 0
    for record in overdue_records:
        if record.status == BorrowStatus.BORROWED:
            try:
                record.transition(BorrowStatus.OVERDUE)
                updated_count += 1
                logger.info(f'借阅记录 {record.id} 已标记为逾期')
            except ValueError as e:
                logger.warning(f'更新借阅记录 {record.id} 状态失败: {e}')
    
    return f'已标记 {updated_count} 条借阅记录为逾期'


@shared_task
def send_overdue_reminders():
    today = timezone.now().date()
    reminder_date = today + timedelta(days=settings.OVERDUE_REMIND_DAYS_BEFORE)
    
    records_to_remind = BorrowRecord.objects.filter(
        status__in=[BorrowStatus.BORROWED],
        due_date=reminder_date,
        is_deleted=False
    ).select_related('family', 'book', 'borrower')
    
    sent_count = 0
    for record in records_to_remind:
        try:
            message = (
                f'温馨提醒：您借阅的《{record.book.title}》'
                f'将在 {settings.OVERDUE_REMIND_DAYS_BEFORE} 天后到期（{record.due_date}），'
                f'请及时归还或续借。'
            )
            send_notification.delay(
                user_id=record.borrower_id,
                title='借阅到期提醒',
                message=message,
                type='overdue_reminder'
            )
            sent_count += 1
        except Exception as e:
            logger.error(f'发送逾期提醒失败 {record.id}: {e}')
    
    return f'已发送 {sent_count} 条到期提醒'


@shared_task
def send_activity_reminders():
    now = timezone.now()
    reminder_time = now + timedelta(hours=24)
    
    activities = Activity.objects.filter(
        start_time__gte=now,
        start_time__lte=reminder_time,
        status__in=['published', 'registration_open', 'registration_closed'],
        is_deleted=False
    )
    
    sent_count = 0
    for activity in activities:
        registrations = ActivityRegistration.objects.filter(
            activity=activity,
            status__in=[RegistrationStatus.REGISTERED, RegistrationStatus.CONFIRMED, RegistrationStatus.PROMOTED],
            is_deleted=False
        ).select_related('registered_by', 'child')
        
        for reg in registrations:
            try:
                message = (
                    f'活动提醒：您报名的「{activity.title}」'
                    f'将在明天 {activity.start_time.strftime("%H:%M")} 开始，'
                    f'地点：{activity.location}。请准时参加！'
                )
                send_notification.delay(
                    user_id=reg.registered_by_id,
                    title='活动开始提醒',
                    message=message,
                    type='activity_reminder'
                )
                sent_count += 1
            except Exception as e:
                logger.error(f'发送活动提醒失败 {reg.id}: {e}')
    
    return f'已发送 {sent_count} 条活动提醒'


@shared_task
def send_notification(user_id, title, message, type='system'):
    from apps.accounts.models import User
    try:
        user = User.objects.get(id=user_id)
        logger.info(f'向用户 {user.username} 发送通知 [{title}]: {message}')
        return True
    except User.DoesNotExist:
        logger.warning(f'用户 {user_id} 不存在，无法发送通知')
        return False


@shared_task
def process_waitlist_promotions(activity_id):
    try:
        activity = Activity.objects.get(id=activity_id)
        promoted = activity.promote_waitlist(count=5)
        
        for reg in promoted:
            try:
                notification = ActivityWaitlistNotification.objects.create(
                    registration=reg,
                    notification_type='promoted',
                    message=(
                        f'恭喜！您报名的「{activity.title}」候补已转正，'
                        f'请在24小时内确认参加，否则名额将顺延给下一位候补。'
                    )
                )
                send_notification.delay(
                    user_id=reg.registered_by_id,
                    title='候补转正通知',
                    message=notification.message,
                    type='waitlist_promoted'
                )
                logger.info(f'活动 {activity_id} 候补转正: 报名记录 {reg.id}')
            except Exception as e:
                logger.error(f'发送候补转正通知失败 {reg.id}: {e}')
        
        return f'已处理 {len(promoted)} 个候补转正'
    except Activity.DoesNotExist:
        return f'活动 {activity_id} 不存在'


@shared_task
def cancel_reservations_for_off_shelf_book(book_id):
    from apps.borrowing.models import Reservation
    from apps.books.models import Book
    
    try:
        book = Book.objects.get(id=book_id)
        reservations = Reservation.objects.filter(
            book=book,
            status='waiting',
            is_deleted=False
        )
        
        cancelled_count = 0
        for res in reservations:
            try:
                res.cancel()
                send_notification.delay(
                    user_id=res.reserved_by_id,
                    title='预约取消通知',
                    message=f'抱歉，《{book.title}》已下架，您的预约已被取消。',
                    type='reservation_cancelled'
                )
                cancelled_count += 1
            except Exception as e:
                logger.error(f'取消预约失败 {res.id}: {e}')
        
        return f'已取消 {cancelled_count} 条《{book.title}》的预约'
    except Book.DoesNotExist:
        return f'绘本 {book_id} 不存在'


@shared_task
def check_expired_reservations():
    now = timezone.now()
    expired = Reservation.objects.filter(
        status='available',
        expires_at__lt=now,
        is_deleted=False
    )
    
    count = 0
    for res in expired:
        try:
            res.status = 'expired'
            res.save()
            count += 1
        except Exception as e:
            logger.error(f'处理过期预约失败 {res.id}: {e}')
    
    return f'已标记 {count} 条预约为过期'
