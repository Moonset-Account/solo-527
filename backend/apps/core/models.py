from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    ROLE_ADMIN = 'admin'
    ROLE_MANAGER = 'manager'
    ROLE_STAFF = 'staff'
    
    ROLE_CHOICES = [
        (ROLE_ADMIN, '系统管理员'),
        (ROLE_MANAGER, '店长'),
        (ROLE_STAFF, '普通员工'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_STAFF)
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    groups = models.ManyToManyField(
        Group,
        verbose_name='groups',
        blank=True,
        related_name='custom_user_groups',
        related_query_name='custom_user'
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name='user permissions',
        blank=True,
        related_name='custom_user_permissions',
        related_query_name='custom_user'
    )

    class Meta:
        db_table = 'sys_user'
        verbose_name = '用户'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.get_full_name() or self.username

    @property
    def is_admin(self):
        return self.role == self.ROLE_ADMIN or self.is_superuser

    @property
    def is_manager(self):
        return self.role in [self.ROLE_ADMIN, self.ROLE_MANAGER] or self.is_superuser


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_created',
        verbose_name='创建人'
    )
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_updated',
        verbose_name='更新人'
    )
    is_active = models.BooleanField(default=True, verbose_name='是否有效')

    class Meta:
        abstract = True


class SystemLog(models.Model):
    LOG_TYPE_LOGIN = 'login'
    LOG_TYPE_OPERATION = 'operation'
    LOG_TYPE_ERROR = 'error'
    
    LOG_TYPE_CHOICES = [
        (LOG_TYPE_LOGIN, '登录日志'),
        (LOG_TYPE_OPERATION, '操作日志'),
        (LOG_TYPE_ERROR, '错误日志'),
    ]
    
    log_type = models.CharField(max_length=20, choices=LOG_TYPE_CHOICES, verbose_name='日志类型')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='操作用户')
    action = models.CharField(max_length=200, verbose_name='操作内容')
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='IP地址')
    user_agent = models.TextField(blank=True, null=True, verbose_name='用户代理')
    request_data = models.JSONField(null=True, blank=True, verbose_name='请求数据')
    response_data = models.JSONField(null=True, blank=True, verbose_name='响应数据')
    error_message = models.TextField(blank=True, null=True, verbose_name='错误信息')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'sys_log'
        verbose_name = '系统日志'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
