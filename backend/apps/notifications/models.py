from django.db import models
from django.conf import settings


class Notification(models.Model):
    """通知消息"""
    TYPE_CHOICES = [
        ('budget_warning', '预算预警'),
        ('inspection_fail', '巡检不合格'),
        ('repair_new', '新报修'),
        ('material_low', '材料不足'),
        ('quotation_confirm', '报价待确认'),
        ('system', '系统通知'),
    ]

    LEVEL_CHOICES = [
        ('info', '提示'),
        ('warning', '警告'),
        ('danger', '严重'),
    ]

    type = models.CharField('类型', max_length=30, choices=TYPE_CHOICES)
    level = models.CharField('级别', max_length=20, choices=LEVEL_CHOICES, default='info')
    title = models.CharField('标题', max_length=200)
    message = models.TextField('内容')
    related_type = models.CharField('关联类型', max_length=50, blank=True)
    related_id = models.PositiveIntegerField('关联ID', null=True, blank=True)

    recipients = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name='notifications', verbose_name='接收人'
    )
    read_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name='read_notifications', verbose_name='已读', blank=True
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='sent_notifications', verbose_name='发送人', null=True, blank=True
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '通知'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['related_type', 'related_id']),
        ]

    def __str__(self):
        return f'{self.get_type_display()} - {self.title}'
