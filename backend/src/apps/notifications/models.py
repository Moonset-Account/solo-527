from django.db import models
from core.models import BaseModel


class Notification(BaseModel):
    TYPE_CHOICES = (
        ('system', '系统通知'),
        ('urgent', '紧急通知'),
        ('daily', '日常通知'),
        ('activity', '活动通知'),
        ('payment', '缴费通知'),
    )
    TARGET_TYPE_CHOICES = (
        ('all', '所有人'),
        ('class', '指定班级'),
        ('child', '指定儿童'),
        ('user', '指定用户'),
    )
    STATUS_CHOICES = (
        ('draft', '草稿'),
        ('published', '已发布'),
        ('cancelled', '已取消'),
    )
    title = models.CharField('标题', max_length=200)
    content = models.TextField('内容')
    type = models.CharField('通知类型', max_length=20, choices=TYPE_CHOICES, default='daily')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='draft')
    target_type = models.CharField('接收范围', max_length=20, choices=TARGET_TYPE_CHOICES, default='all')
    target_classes = models.ManyToManyField('children.ChildClass', blank=True, related_name='notifications', verbose_name='指定班级')
    target_children = models.ManyToManyField('children.Child', blank=True, related_name='notifications', verbose_name='指定儿童')
    target_users = models.ManyToManyField('accounts.User', blank=True, related_name='notifications', verbose_name='指定用户')
    published_at = models.DateTimeField('发布时间', null=True, blank=True)
    published_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='published_notifications', verbose_name='发布人')
    need_ack = models.BooleanField('需要确认', default=False)
    deadline = models.DateTimeField('截止时间', null=True, blank=True)

    class Meta:
        verbose_name = '通知'
        verbose_name_plural = verbose_name
        ordering = ['-published_at', '-created_at']

    def __str__(self):
        return self.title


class NotificationRead(BaseModel):
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='reads', verbose_name='通知')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='notification_reads', verbose_name='用户')
    read_at = models.DateTimeField('阅读时间', auto_now_add=True)
    ack_at = models.DateTimeField('确认时间', null=True, blank=True)

    class Meta:
        verbose_name = '通知阅读记录'
        verbose_name_plural = verbose_name
        unique_together = ('notification', 'user')

    def __str__(self):
        return f'{self.user.name} - {self.notification.title}'


class NotificationAttachment(BaseModel):
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='attachments', verbose_name='通知')
    file = models.FileField('附件', upload_to='notification_attachments/')
    file_name = models.CharField('文件名', max_length=200)
    file_size = models.IntegerField('文件大小(字节)', default=0)

    class Meta:
        verbose_name = '通知附件'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.file_name


class Message(BaseModel):
    sender = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='sent_messages', verbose_name='发送人')
    receiver = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='received_messages', verbose_name='接收人')
    content = models.TextField('消息内容')
    type = models.CharField('类型', max_length=20, choices=(
        ('text', '文字'),
        ('image', '图片'),
        ('voice', '语音'),
    ), default='text')
    attachment = models.FileField('附件', upload_to='message_attachments/', null=True, blank=True)
    is_read = models.BooleanField('已读', default=False)
    read_at = models.DateTimeField('阅读时间', null=True, blank=True)
    related_child = models.ForeignKey('children.Child', on_delete=models.SET_NULL, null=True, blank=True, related_name='messages', verbose_name='关联儿童')

    class Meta:
        verbose_name = '家长消息'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.sender.name} -> {self.receiver.name}'
