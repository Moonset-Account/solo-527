from django.db import models
from django.conf import settings
from children.models import ClassGroup


class Notification(models.Model):
    TARGET_CHOICES = [
        ('all', '全体'),
        ('class', '按班级'),
        ('individual', '个人'),
    ]
    title = models.CharField('标题', max_length=200)
    content = models.TextField('内容')
    target_type = models.CharField('目标类型', max_length=20, choices=TARGET_CHOICES, default='all')
    target_class = models.ForeignKey(
        ClassGroup, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='notifications', verbose_name='目标班级',
    )
    target_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        null=True, blank=True, related_name='targeted_notifications', verbose_name='目标用户',
    )
    is_urgent = models.BooleanField('紧急', default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='created_notifications', verbose_name='发布人',
    )
    created_at = models.DateTimeField('发布时间', auto_now_add=True)

    class Meta:
        db_table = 'notifications_notification'
        verbose_name = '通知'
        verbose_name_plural = verbose_name
        indexes = [
            models.Index(fields=['target_type', 'created_at'], name='idx_notif_type_time'),
            models.Index(fields=['target_user', 'created_at'], name='idx_notif_user_time'),
        ]

    def __str__(self):
        return self.title


class NotificationRead(models.Model):
    notification = models.ForeignKey(
        Notification, on_delete=models.CASCADE,
        related_name='reads', verbose_name='通知',
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='notification_reads', verbose_name='用户',
    )
    read_at = models.DateTimeField('阅读时间', auto_now_add=True)

    class Meta:
        db_table = 'notifications_notificationread'
        verbose_name = '通知已读'
        verbose_name_plural = verbose_name
        unique_together = [('notification', 'user')]

    def __str__(self):
        return f'{self.user.username} read {self.notification.title}'
