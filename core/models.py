from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from auditlog.registry import auditlog
import uuid


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('邮箱地址必须填写'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        MEMBER = 'member', _('普通会员')
        TRAINER = 'trainer', _('培训师')
        TECHNICIAN = 'technician', _('技术人员')
        ADMIN = 'admin', _('管理员')

    username = None
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('邮箱地址'), unique=True)
    phone = models.CharField(_('手机号码'), max_length=20, blank=True)
    real_name = models.CharField(_('真实姓名'), max_length=100)
    role = models.CharField(_('角色'), max_length=20, choices=Role.choices, default=Role.MEMBER)
    avatar = models.ImageField(_('头像'), upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(_('个人简介'), blank=True)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['real_name']

    objects = UserManager()

    class Meta:
        verbose_name = _('用户')
        verbose_name_plural = _('用户')
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.real_name} ({self.email})'

    @property
    def is_trainer_or_admin(self):
        return self.role in [self.Role.TRAINER, self.Role.ADMIN]

    @property
    def is_technician_or_admin(self):
        return self.role in [self.Role.TECHNICIAN, self.Role.ADMIN]


class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='%(class)s_created',
        null=True,
        blank=True,
        verbose_name=_('创建人')
    )
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='%(class)s_updated',
        null=True,
        blank=True,
        verbose_name=_('更新人')
    )

    class Meta:
        abstract = True


auditlog.register(User)
