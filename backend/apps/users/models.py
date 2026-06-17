from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('用户必须有邮箱地址')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', '管理员'),
        ('project_manager', '项目经理'),
        ('material_staff', '材料员'),
        ('inspector', '巡检员'),
        ('finance', '财务'),
        ('worker', '施工人员'),
    ]

    username = None
    email = models.EmailField('邮箱', unique=True)
    phone = models.CharField('手机号', max_length=20, blank=True)
    role = models.CharField('角色', max_length=20, choices=ROLE_CHOICES, default='worker')
    avatar = models.ImageField('头像', upload_to='avatars/', null=True, blank=True)
    department = models.CharField('部门', max_length=100, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = verbose_name
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.get_full_name() or self.email} ({self.get_role_display()})'
