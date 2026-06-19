from celery import shared_task
from django.utils import timezone
from .models import Notification
from .services import create_notification
from topics.models import Topic
from voting.models import Vote
from residents.models import Resident
from django.db.models import Q


@shared_task
def send_daily_reminders():
    now = timezone.now()
    today = now.date()

    topics_today = Topic.objects.filter(
        Q(status='voting') &
        (Q(voting_end_time__date=today) | Q(deadline__date=today))
    )

    for topic in topics_today:
        residents = Resident.objects.filter(
            is_voter_qualified=True,
            user__community=topic.community if topic.community else ''
        ) if topic.community else Resident.objects.filter(is_voter_qualified=True)

        for resident in residents:
            if not Vote.objects.filter(topic=topic, voter=resident.user).exists():
                create_notification(
                    user=resident.user,
                    title='投票截止提醒',
                    content=f'议题「{topic.title}」的投票将于今日截止，请及时参与！',
                    type='voting',
                    related_id=topic.id
                )

    return f"已发送 {topics_today.count()} 个议题的提醒"


@shared_task
def send_scheduled_notification(notification_id):
    try:
        notification = Notification.objects.get(id=notification_id)
        if notification.channel == 'email' and notification.user.email:
            from django.core.mail import send_mail
            send_mail(
                notification.title,
                notification.content,
                settings.DEFAULT_FROM_EMAIL,
                [notification.user.email],
                fail_silently=True
            )
        notification.is_sent = True
        notification.sent_at = timezone.now()
        notification.save()
        return f"已发送通知 {notification_id}"
    except Notification.DoesNotExist:
        return f"通知 {notification_id} 不存在"


@shared_task
def cleanup_old_notifications(days=30):
    cutoff = timezone.now() - timezone.timedelta(days=days)
    count = Notification.objects.filter(created_at__lt=cutoff, is_read=True).delete()
    return f"已清理 {count[0]} 条已读通知"
