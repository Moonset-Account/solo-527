from django.db import models


class AuditLog(models.Model):
    ACTION_CREATE = 'create'
    ACTION_UPDATE = 'update'
    ACTION_DELETE = 'delete'
    ACTION_LOGIN = 'login'
    ACTION_LOGOUT = 'logout'
    ACTION_CUSTOM = 'custom'

    ACTION_CHOICES = [
        (ACTION_CREATE, '创建'),
        (ACTION_UPDATE, '更新'),
        (ACTION_DELETE, '删除'),
        (ACTION_LOGIN, '登录'),
        (ACTION_LOGOUT, '登出'),
        (ACTION_CUSTOM, '自定义'),
    ]

    organization = models.ForeignKey(
        'accounts.Organization',
        on_delete=models.CASCADE,
        related_name='audit_logs',
        null=True,
        blank=True,
        verbose_name='所属组织'
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        verbose_name='操作用户'
    )
    username = models.CharField(max_length=150, blank=True, verbose_name='用户名')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, default=ACTION_CUSTOM, verbose_name='操作类型')
    resource_type = models.CharField(max_length=100, blank=True, verbose_name='资源类型')
    resource_id = models.CharField(max_length=100, blank=True, verbose_name='资源ID')
    resource_name = models.CharField(max_length=200, blank=True, verbose_name='资源名称')
    method = models.CharField(max_length=20, blank=True, verbose_name='请求方法')
    path = models.CharField(max_length=500, blank=True, verbose_name='请求路径')
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='IP地址')
    user_agent = models.CharField(max_length=500, blank=True, verbose_name='User Agent')
    status_code = models.IntegerField(null=True, blank=True, verbose_name='响应状态码')
    request_data = models.TextField(blank=True, null=True, verbose_name='请求数据')
    response_data = models.TextField(blank=True, null=True, verbose_name='响应数据')
    old_values = models.TextField(blank=True, null=True, verbose_name='旧值')
    new_values = models.TextField(blank=True, null=True, verbose_name='新值')
    detail = models.TextField(blank=True, null=True, verbose_name='详情')
    is_success = models.BooleanField(default=True, verbose_name='是否成功')
    error_message = models.TextField(blank=True, null=True, verbose_name='错误信息')
    duration_ms = models.IntegerField(default=0, verbose_name='耗时(毫秒)')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '审计日志'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', '-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action', '-created_at']),
            models.Index(fields=['resource_type', 'resource_id']),
        ]

    def __str__(self):
        return f'{self.username} - {self.action} - {self.created_at}'
