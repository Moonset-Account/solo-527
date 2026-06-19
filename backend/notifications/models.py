from django.db import models
from django.conf import settings
from django.utils import timezone
from common.models import BaseModel
from common.managers import ProductionDataManager, TestDataManager


class Notification(BaseModel):
    TYPE_CHOICES = (
        ('system', '系统通知'),
        ('voting', '投票提醒'),
        ('patrol', '巡逻通知'),
        ('assistance', '帮扶通知'),
        ('topic', '议题通知'),
        ('todo', '待办提醒'),
        ('volunteer', '志愿者通知'),
        ('other', '其他通知'),
    )

    CHANNEL_CHOICES = (
        ('in_app', '站内消息'),
        ('sms', '短信'),
        ('email', '邮件'),
        ('wechat', '微信'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='接收人'
    )
    title = models.CharField(max_length=200, verbose_name='标题')
    content = models.TextField(verbose_name='内容')
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='system', verbose_name='类型')
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default='in_app', verbose_name='发送渠道')
    is_read = models.BooleanField(default=False, verbose_name='是否已读')
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='阅读时间')
    related_id = models.IntegerField(null=True, blank=True, verbose_name='关联ID')
    related_type = models.CharField(max_length=50, blank=True, verbose_name='关联类型')
    sent_at = models.DateTimeField(default=timezone.now, verbose_name='发送时间')
    scheduled_at = models.DateTimeField(null=True, blank=True, verbose_name='预定发送时间')
    is_sent = models.BooleanField(default=True, verbose_name='是否已发送')
    error_message = models.TextField(blank=True, verbose_name='错误信息')

    objects = ProductionDataManager()
    test_objects = TestDataManager()

    class Meta:
        verbose_name = '通知'
        verbose_name_plural = verbose_name
        ordering = ['-sent_at', '-created_at']

    def __str__(self):
        return f'{self.title} - {self.user.get_full_name()} - {self.get_type_display()}'

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
