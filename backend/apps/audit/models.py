from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from apps.users.models import User


class OperationType(models.TextChoices):
    CREATE = 'create', '创建'
    UPDATE = 'update', '更新'
    DELETE = 'delete', '删除'
    LOGIN = 'login', '登录'
    LOGOUT = 'logout', '登出'
    EXPORT = 'export', '导出'
    APPROVE = 'approve', '审核通过'
    REJECT = 'reject', '审核拒绝'
    NOTIFY = 'notify', '发送通知'
    ASSIGN = 'assign', '分配任务'
    COMPLETE = 'complete', '完成任务'


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='操作用户')
    username = models.CharField(max_length=150, blank=True, verbose_name='用户名（冗余）')
    operation = models.CharField(max_length=30, choices=OperationType.choices, verbose_name='操作类型')
    module = models.CharField(max_length=100, verbose_name='模块')
    description = models.TextField(blank=True, verbose_name='操作描述')
    content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='内容类型')
    object_id = models.BigIntegerField(null=True, blank=True, verbose_name='对象ID')
    content_object = GenericForeignKey('content_type', 'object_id')
    old_data = models.JSONField(null=True, blank=True, verbose_name='旧数据')
    new_data = models.JSONField(null=True, blank=True, verbose_name='新数据')
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='IP地址')
    user_agent = models.TextField(blank=True, verbose_name='用户代理')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')

    class Meta:
        verbose_name = '操作日志'
        verbose_name_plural = '操作日志'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['module', 'operation']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.username} - {self.get_operation_display()} - {self.module}'
