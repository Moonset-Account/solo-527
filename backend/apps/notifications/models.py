from django.db import models
from apps.common import BaseModel


class NotificationRule(BaseModel):
    TRIGGER_ALERT_NEW = 'alert_created'
    TRIGGER_ALERT_ACK = 'alert_level_escalated'
    TRIGGER_ALERT_CLOSE = 'alert_auto_closed'
    TRIGGER_CHANGE_APPROVAL = 'change_window_approved'
    TRIGGER_CHANGE_START = 'change_window_started'
    TRIGGER_CHANGE_COMPLETE = 'change_window_completed'
    TRIGGER_CHANGE_FAILED = 'change_window_failed'
    TRIGGER_INSPECTION_COMPLETED = 'inspection_completed'
    TRIGGER_INSPECTION_FAILED = 'inspection_failed'

    TRIGGER_CHOICES = [
        (TRIGGER_ALERT_NEW, '告警创建'),
        (TRIGGER_ALERT_ACK, '告警升级'),
        (TRIGGER_ALERT_CLOSE, '告警自动关闭'),
        (TRIGGER_CHANGE_APPROVAL, '变更审批'),
        (TRIGGER_CHANGE_START, '变更开始'),
        (TRIGGER_CHANGE_COMPLETE, '变更完成'),
        (TRIGGER_CHANGE_FAILED, '变更失败'),
        (TRIGGER_INSPECTION_COMPLETED, '巡检完成'),
        (TRIGGER_INSPECTION_FAILED, '巡检失败'),
    ]

    METHOD_IN_APP = 'in_app'
    METHOD_EMAIL = 'email'
    METHOD_SMS = 'sms'
    METHOD_DINGTALK = 'dingtalk'
    METHOD_WECHAT = 'wechat'
    METHOD_WEBHOOK = 'webhook'

    METHOD_CHOICES = [
        (METHOD_IN_APP, '站内消息'),
        (METHOD_EMAIL, '邮件'),
        (METHOD_SMS, '短信'),
        (METHOD_DINGTALK, '钉钉'),
        (METHOD_WECHAT, '企业微信'),
        (METHOD_WEBHOOK, 'Webhook'),
    ]

    LEVEL_INFO = 'info'
    LEVEL_WARNING = 'warning'
    LEVEL_CRITICAL = 'critical'
    LEVEL_EMERGENCY = 'emergency'

    SEVERITY_CHOICES = [
        ('', '全部'),
        (LEVEL_INFO, '提示及以上'),
        (LEVEL_WARNING, '告警及以上'),
        (LEVEL_CRITICAL, '严重及以上'),
        (LEVEL_EMERGENCY, '仅紧急'),
    ]

    name = models.CharField(max_length=100, verbose_name='规则名称')
    trigger = models.CharField(max_length=50, choices=TRIGGER_CHOICES, verbose_name='触发事件')
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default=METHOD_IN_APP, verbose_name='通知方式')
    channels = models.JSONField(default=list, verbose_name='通知渠道列表')
    alert_levels = models.CharField(max_length=100, blank=True, verbose_name='告警级别(逗号分隔)')
    severity_level = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='', blank=True, verbose_name='严重级别阈值')
    recipients = models.ManyToManyField(
        'accounts.User',
        blank=True,
        related_name='notification_rules',
        verbose_name='接收人'
    )
    recipient_emails = models.TextField(blank=True, verbose_name='额外邮箱(逗号分隔)')
    template = models.TextField(blank=True, verbose_name='通知模板')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    is_enabled = models.BooleanField(default=True, verbose_name='是否启用(别名)')
    description = models.TextField(blank=True, null=True, verbose_name='描述')

    class Meta:
        verbose_name = '通知规则'
        verbose_name_plural = verbose_name
        unique_together = [('organization', 'name')]
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def alert_level_list(self):
        return [l.strip() for l in self.alert_levels.split(',') if l.strip()]

    @property
    def event_type(self):
        return self.trigger

    @property
    def event_type_display(self):
        return self.get_trigger_display()

    def save(self, *args, **kwargs):
        if self.is_active != self.is_enabled:
            self.is_enabled = self.is_active
        if not self.channels and self.method:
            self.channels = [self.method]
        super().save(*args, **kwargs)


class Notification(BaseModel):
    TYPE_INFO = 'info'
    TYPE_WARNING = 'warning'
    TYPE_CRITICAL = 'critical'
    TYPE_SUCCESS = 'success'

    TYPE_CHOICES = [
        (TYPE_INFO, '提示'),
        (TYPE_WARNING, '警告'),
        (TYPE_CRITICAL, '严重'),
        (TYPE_SUCCESS, '成功'),
    ]

    STATUS_UNREAD = 'unread'
    STATUS_READ = 'read'
    STATUS_ARCHIVED = 'archived'

    STATUS_CHOICES = [
        (STATUS_UNREAD, '未读'),
        (STATUS_READ, '已读'),
        (STATUS_ARCHIVED, '已归档'),
    ]

    recipient = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='接收人'
    )
    title = models.CharField(max_length=200, verbose_name='标题')
    content = models.TextField(verbose_name='内容')
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_INFO, verbose_name='类型')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_UNREAD, verbose_name='状态')
    related_type = models.CharField(max_length=50, blank=True, verbose_name='关联类型')
    related_id = models.CharField(max_length=50, blank=True, verbose_name='关联ID')
    rule = models.ForeignKey(
        NotificationRule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications',
        verbose_name='触发规则'
    )
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='阅读时间')

    class Meta:
        verbose_name = '站内通知'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.recipient} - {self.title}'
