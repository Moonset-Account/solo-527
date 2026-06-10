import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError('邮箱地址不能为空')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'super_admin')
        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    ROLE_CHOICES = (
        ('super_admin', '超级管理员'),
        ('host', '民宿房东'),
        ('operator', '运营人员'),
        ('receptionist', '前台接待'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None
    email = models.EmailField('邮箱', unique=True)
    role = models.CharField('角色', max_length=20, choices=ROLE_CHOICES, default='operator')
    phone = models.CharField('手机号', max_length=20, blank=True)
    real_name = models.CharField('真实姓名', max_length=50, blank=True)
    avatar = models.ImageField('头像', upload_to='avatars/', null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = 'user'
        verbose_name = '用户'
        verbose_name_plural = '用户'

    def __str__(self):
        return f'{self.real_name or self.email} ({self.get_role_display()})'

    @property
    def role_display(self):
        return dict(self.ROLE_CHOICES).get(self.role, self.role)
