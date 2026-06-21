from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _


class UserRole(models.TextChoices):
    PROCUREMENT_MANAGER = 'procurement_manager', _('采购经理')
    PROJECT_MANAGER = 'project_manager', _('项目负责人')
    DUTY_OFFICER = 'duty_officer', _('值班人员')
    FINANCE = 'finance', _('财务人员')
    APPROVER = 'approver', _('审批人')
    ADMIN = 'admin', _('系统管理员')


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('邮箱必须填写'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.ADMIN)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None
    email = models.EmailField(_('邮箱'), unique=True)
    role = models.CharField(_('角色'), max_length=30, choices=UserRole.choices, default=UserRole.DUTY_OFFICER)
    phone = models.CharField(_('手机号'), max_length=20, blank=True)
    department = models.CharField(_('部门'), max_length=100, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        verbose_name = _('用户')
        verbose_name_plural = _('用户')

    def __str__(self):
        return f'{self.get_full_name()} ({self.get_role_display()})'


class SavedFilter(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_filters', verbose_name=_('用户'))
    name = models.CharField(_('筛选名称'), max_length=100)
    module = models.CharField(_('所属模块'), max_length=50)
    filter_params = models.JSONField(_('筛选参数'), default=dict)
    is_shared = models.BooleanField(_('是否共享'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        verbose_name = _('收藏筛选')
        verbose_name_plural = _('收藏筛选')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} - {self.name} ({self.module})'
