from .models import Notification
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone


def create_notification(user, title, content, type='system', channel='in_app', related_id=None, related_type=None):
    notification = Notification.objects.create(
        user=user,
        title=title,
        content=content,
        type=type,
        channel=channel,
        related_id=related_id,
        related_type=related_type,
        is_sent=True,
        sent_at=timezone.now()
    )

    if channel == 'email' and user.email:
        try:
            send_mail(
                title,
                content,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=True
            )
        except Exception as e:
            notification.error_message = str(e)
            notification.is_sent = False
            notification.save()

    return notification


def send_bulk_notifications(users, title, content, type='system', channel='in_app'):
    created = []
    for user in users:
        notification = create_notification(user, title, content, type, channel)
        created.append(notification)
    return created


def get_unread_count(user):
    return Notification.objects.filter(user=user, is_read=False).count()


def mark_all_as_read(user):
    return Notification.objects.filter(user=user, is_read=False).update(
        is_read=True,
        read_at=timezone.now()
    )
