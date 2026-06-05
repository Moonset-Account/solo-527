from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('create', '创建'),
        ('update', '更新'),
        ('delete', '删除'),
        ('verify', '核验'),
        ('approve', '审批'),
        ('reject', '拒绝'),
        ('login', '登录'),
        ('export', '导出'),
    ]
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, verbose_name='操作人',
    )
    action = models.CharField('操作', max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField('模型名', max_length=100)
    object_id = models.CharField('对象ID', max_length=100, blank=True, default='')
    detail = models.TextField('详情', blank=True, default='')
    ip_address = models.GenericIPAddressField('IP地址', null=True, blank=True)
    created_at = models.DateTimeField('操作时间', auto_now_add=True)

    class Meta:
        db_table = 'common_auditlog'
        verbose_name = '审计日志'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at'], name='idx_audit_user_time'),
            models.Index(fields=['model_name', 'action'], name='idx_audit_model_action'),
            models.Index(fields=['created_at'], name='idx_audit_time'),
        ]

    def __str__(self):
        return f'{self.user} - {self.get_action_display()} - {self.model_name}'


def log_audit(user, action, model_name, object_id='', detail='', ip_address=None):
    AuditLog.objects.create(
        user=user,
        action=action,
        model_name=model_name,
        object_id=str(object_id),
        detail=detail,
        ip_address=ip_address,
    )
