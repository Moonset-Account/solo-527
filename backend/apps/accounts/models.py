from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _


class Organization(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='组织名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='组织编码')
    description = models.TextField(blank=True, null=True, verbose_name='描述')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '组织'
        verbose_name_plural = verbose_name
        ordering = ['name']

    def __str__(self):
        return self.name


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, username, email, password, **extra_fields):
        if not username:
            raise ValueError('用户名必须设置')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(username, email, password, **extra_fields)

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_admin', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('超级用户必须设置 is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('超级用户必须设置 is_superuser=True')
        return self._create_user(username, email, password, **extra_fields)


class User(AbstractUser):
    ROLE_NORMAL = 'normal'
    ROLE_SECURITY_OWNER = 'security_owner'
    ROLE_ADMIN = 'admin'

    ROLE_CHOICES = [
        (ROLE_NORMAL, '普通用户'),
        (ROLE_SECURITY_OWNER, '安全负责人'),
        (ROLE_ADMIN, '管理员'),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='users',
        null=True,
        blank=True,
        verbose_name='所属组织'
    )
    name = models.CharField(max_length=50, blank=True, verbose_name='姓名')
    phone = models.CharField(max_length=20, blank=True, verbose_name='手机号')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_NORMAL, verbose_name='角色')
    is_admin = models.BooleanField(default=False, verbose_name='是否管理员')

    objects = UserManager()

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = verbose_name
        ordering = ['username']

    def __str__(self):
        return self.name or self.username

    @property
    def is_security_owner(self):
        return self.role == self.ROLE_SECURITY_OWNER or self.is_admin

    def save(self, *args, **kwargs):
        if self.is_admin:
            self.role = self.ROLE_ADMIN
        super().save(*args, **kwargs)
