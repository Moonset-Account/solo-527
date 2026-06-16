from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _


class Role(models.TextChoices):
    STUDENT = 'student', '学生'
    DORM_MANAGER = 'dorm_manager', '宿管老师'
    ADMIN = 'admin', '管理员'
    MAINTENANCE = 'maintenance', '维修人员'


class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError(_('用户名必须设置'))
        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', Role.ADMIN)
        return self.create_user(username, password, **extra_fields)


class User(AbstractUser):
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT, verbose_name='角色')
    phone = models.CharField(max_length=20, blank=True, verbose_name='手机号')
    student_id = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name='学号/工号')
    dorm_building = models.CharField(max_length=50, blank=True, verbose_name='宿舍楼')
    dorm_room = models.CharField(max_length=20, blank=True, verbose_name='宿舍号')
    real_name = models.CharField(max_length=50, blank=True, verbose_name='真实姓名')
    is_verified = models.BooleanField(default=False, verbose_name='身份已审核')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='头像')

    objects = UserManager()

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.real_name or self.username}({self.get_role_display()})'


class RoleConfig(models.Model):
    role = models.CharField(max_length=20, choices=Role.choices, unique=True, verbose_name='角色')
    description = models.TextField(blank=True, verbose_name='描述')
    permissions = models.JSONField(default=dict, verbose_name='权限配置')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '角色配置'
        verbose_name_plural = '角色配置'

    def __str__(self):
        return self.get_role_display()


class RoleConfigHistory(models.Model):
    role_config = models.ForeignKey(RoleConfig, on_delete=models.CASCADE, related_name='history', verbose_name='角色配置')
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='修改人')
    old_data = models.JSONField(verbose_name='旧数据')
    new_data = models.JSONField(verbose_name='新数据')
    change_reason = models.TextField(blank=True, verbose_name='修改原因')
    changed_at = models.DateTimeField(auto_now_add=True, verbose_name='修改时间')

    class Meta:
        verbose_name = '角色配置变更记录'
        verbose_name_plural = '角色配置变更记录'
        ordering = ['-changed_at']

    def __str__(self):
        return f'{self.role_config} - {self.changed_at}'
