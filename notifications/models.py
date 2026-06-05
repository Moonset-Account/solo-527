from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel, User
from auditlog.registry import auditlog
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class Notification(BaseModel):
    class Type(models.TextChoices):
        SYSTEM = 'system', _('系统通知')
        BOOKING = 'booking', _('预约通知')
        TRAINING = 'training', _('培训通知')
        MAINTENANCE = 'maintenance', _('维护通知')
        SAFETY = 'safety', _('安全通知')
        CONSUMABLE = 'consumable', _('耗材通知')

    class Priority(models.TextChoices):
        LOW = 'low', _('普通')
        MEDIUM = 'medium', _('重要')
        HIGH = 'high', _('紧急')

    type = models.CharField(_('通知类型'), max_length=20, choices=Type.choices, default=Type.SYSTEM)
    priority = models.CharField(_('优先级'), max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    title = models.CharField(_('标题'), max_length=200)
    content = models.TextField(_('内容'))
    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name=_('接收人')
    )
    is_read = models.BooleanField(_('已读'), default=False)
    read_at = models.DateTimeField(_('阅读时间'), null=True, blank=True)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('关联内容类型')
    )
    object_id = models.UUIDField(_('关联对象ID'), null=True, blank=True)
    related_object = GenericForeignKey('content_type', 'object_id')
    action_url = models.URLField(_('操作链接'), max_length=500, blank=True)

    class Meta:
        verbose_name = _('通知')
        verbose_name_plural = _('通知')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read', '-created_at']),
            models.Index(fields=['type', 'created_at']),
            models.Index(fields=['priority', 'created_at']),
        ]

    def __str__(self):
        return f'{self.title} - {self.recipient.real_name}'


class NotificationTemplate(models.Model):
    name = models.CharField(_('模板名称'), max_length=100, unique=True)
    type = models.CharField(_('通知类型'), max_length=20, choices=Notification.Type.choices)
    title_template = models.CharField(_('标题模板'), max_length=200)
    content_template = models.TextField(_('内容模板'))
    description = models.TextField(_('描述'), blank=True)
    is_active = models.BooleanField(_('启用'), default=True)
    variables = models.JSONField(_('可用变量'), default=list, blank=True)

    class Meta:
        verbose_name = _('通知模板')
        verbose_name_plural = _('通知模板')

    def __str__(self):
        return self.name


class NotificationPreference(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='notification_preferences',
        verbose_name=_('用户')
    )
    email_enabled = models.BooleanField(_('邮件通知'), default=True)
    push_enabled = models.BooleanField(_('推送通知'), default=True)
    sms_enabled = models.BooleanField(_('短信通知'), default=False)
    muted_types = models.JSONField(_('静音通知类型'), default=list, blank=True)
    quiet_hours_start = models.TimeField(_('免打扰开始时间'), null=True, blank=True)
    quiet_hours_end = models.TimeField(_('免打扰结束时间'), null=True, blank=True)

    class Meta:
        verbose_name = _('通知偏好设置')
        verbose_name_plural = _('通知偏好设置')

    def __str__(self):
        return f'{self.user.real_name} 的通知偏好'


auditlog.register(Notification)
auditlog.register(NotificationTemplate)
