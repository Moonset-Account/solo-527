from django.db import models
from django.conf import settings
from apps.users.models import User


class NotificationType(models.TextChoices):
    ANNOUNCEMENT = 'announcement', '公告'
    REPAIR_STATUS = 'repair_status', '报修状态更新'
    SYSTEM = 'system', '系统通知'
    VERIFICATION = 'verification', '身份审核'


class Notification(models.Model):
    title = models.CharField(max_length=200, verbose_name='标题')
    content = models.TextField(verbose_name='内容')
    type = models.CharField(max_length=30, choices=NotificationType.choices, default=NotificationType.SYSTEM, verbose_name='类型')
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sent_notifications', verbose_name='发送人')
    repair_request = models.ForeignKey('repairs.RepairRequest', on_delete=models.CASCADE, null=True, blank=True, verbose_name='关联报修')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    is_published = models.BooleanField(default=True, verbose_name='是否发布')
    priority = models.CharField(max_length=10, choices=[('normal', '普通'), ('important', '重要'), ('urgent', '紧急')], default='normal', verbose_name='优先级')

    class Meta:
        verbose_name = '通知'
        verbose_name_plural = '通知'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class UserNotification(models.Model):
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='user_notifications', verbose_name='通知')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', verbose_name='接收人')
    is_read = models.BooleanField(default=False, verbose_name='是否已读')
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='已读时间')

    class Meta:
        verbose_name = '用户通知'
        verbose_name_plural = '用户通知'
        unique_together = ['notification', 'user']
        ordering = ['-notification__created_at']

    def __str__(self):
        return f'{self.user} - {self.notification.title}'


class Announcement(models.Model):
    title = models.CharField(max_length=200, verbose_name='标题')
    content = models.TextField(verbose_name='内容')
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='发布人')
    target_roles = models.JSONField(default=list, verbose_name='目标角色', help_text='空表示全部角色')
    target_buildings = models.JSONField(default=list, verbose_name='目标楼栋', help_text='空表示全部楼栋')
    is_top = models.BooleanField(default=False, verbose_name='是否置顶')
    is_published = models.BooleanField(default=True, verbose_name='是否发布')
    published_at = models.DateTimeField(null=True, blank=True, verbose_name='发布时间')
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name='过期时间')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '公告'
        verbose_name_plural = '公告'
        ordering = ['-is_top', '-created_at']

    def __str__(self):
        return self.title
