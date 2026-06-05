from django.db import models
from django.utils.translation import gettext_lazy as _
from phonenumber_field.modelfields import PhoneNumberField
from core.models import User
from patients.models import PatientProfile
from appointments.models import Appointment, MedicationReminder


class SMSMessage(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('待发送')
        SENT = 'SENT', _('已发送')
        FAILED = 'FAILED', _('发送失败')
        DELIVERED = 'DELIVERED', _('已送达')

    class MessageType(models.TextChoices):
        APPOINTMENT_REMINDER = 'APPT_REMIND', _('预约提醒')
        CONFIRMATION = 'CONFIRM', _('确认通知')
        MEDICATION_REMINDER = 'MED_REMIND', _('用药提醒')
        CANCELLATION = 'CANCEL', _('取消通知')
        NO_SHOW_ALERT = 'NO_SHOW', _('爽约提醒')
        FOLLOWUP_REMINDER = 'FU_REMIND', _('随访提醒')

    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='sms_messages',
        null=True,
        blank=True,
        verbose_name=_('患者')
    )
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sms_messages',
        verbose_name=_('关联预约')
    )
    medication_reminder = models.ForeignKey(
        MedicationReminder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sms_messages',
        verbose_name=_('关联用药提醒')
    )
    message_type = models.CharField(
        max_length=30,
        choices=MessageType.choices,
        verbose_name=_('消息类型')
    )
    phone_number = PhoneNumberField(verbose_name=_('手机号'), region='CN')
    content = models.TextField(verbose_name=_('短信内容'))
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name=_('状态')
    )
    provider_message_id = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_('服务商消息ID')
    )
    sent_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('发送时间')
    )
    delivered_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('送达时间')
    )
    error_message = models.TextField(
        blank=True,
        verbose_name=_('错误信息')
    )
    retry_count = models.IntegerField(
        default=0,
        verbose_name=_('重试次数')
    )
    scheduled_send_time = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('计划发送时间')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_sms',
        verbose_name=_('创建人')
    )

    class Meta:
        verbose_name = _('短信记录')
        verbose_name_plural = _('短信记录')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_message_type_display()} - {self.phone_number}'

    def mark_sent(self, message_id=None):
        from django.utils import timezone
        self.status = self.Status.SENT
        self.sent_at = timezone.now()
        if message_id:
            self.provider_message_id = message_id
        self.save()

    def mark_delivered(self):
        from django.utils import timezone
        self.status = self.Status.DELIVERED
        self.delivered_at = timezone.now()
        self.save()

    def mark_failed(self, error_message):
        self.status = self.Status.FAILED
        self.error_message = error_message
        self.retry_count += 1
        self.save()


class Notification(models.Model):
    class Type(models.TextChoices):
        INFO = 'INFO', _('通知')
        WARNING = 'WARNING', _('警告')
        ALERT = 'ALERT', _('紧急')

    class Status(models.TextChoices):
        UNREAD = 'UNREAD', _('未读')
        READ = 'READ', _('已读')

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name=_('接收用户')
    )
    title = models.CharField(max_length=200, verbose_name=_('标题'))
    message = models.TextField(verbose_name=_('内容'))
    type = models.CharField(
        max_length=20,
        choices=Type.choices,
        default=Type.INFO,
        verbose_name=_('类型')
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UNREAD,
        verbose_name=_('状态')
    )
    related_url = models.CharField(
        max_length=500,
        blank=True,
        verbose_name=_('关联链接')
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('阅读时间')
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('系统通知')
        verbose_name_plural = _('系统通知')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} - {self.title}'

    def mark_read(self):
        from django.utils import timezone
        self.status = self.Status.READ
        self.read_at = timezone.now()
        self.save()
