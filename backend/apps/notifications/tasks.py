from celery import shared_task
from .models import Notification, NotificationRule


@shared_task
def send_notification(recipient_id, title, content, notification_type='info',
                      related_type='', related_id='', rule_id=None):
    from apps.accounts.models import User
    try:
        user = User.objects.get(id=recipient_id)
        Notification.objects.create(
            organization=user.organization,
            recipient=user,
            title=title,
            content=content,
            notification_type=notification_type,
            related_type=related_type,
            related_id=str(related_id) if related_id else '',
            rule_id=rule_id,
            created_by=user,
            updated_by=user
        )
    except User.DoesNotExist:
        pass


@shared_task
def trigger_notifications(trigger, title, content, organization_id,
                          notification_type='info', related_type='', related_id=''):
    rules = NotificationRule.objects.filter(
        organization_id=organization_id,
        trigger=trigger,
        is_active=True
    )
    for rule in rules:
        for recipient in rule.recipients.all():
            send_notification.delay(
                recipient_id=recipient.id,
                title=title,
                content=content,
                notification_type=notification_type,
                related_type=related_type,
                related_id=related_id,
                rule_id=rule.id
            )
