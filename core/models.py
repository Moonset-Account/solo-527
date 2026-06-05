from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from phonenumber_field.modelfields import PhoneNumberField


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', _('管理员')
        DOCTOR = 'DOCTOR', _('医生')
        NURSE = 'NURSE', _('护士')
        PATIENT = 'PATIENT', _('患者')

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.PATIENT,
        verbose_name=_('角色')
    )
    phone = PhoneNumberField(
        verbose_name=_('手机号'),
        null=True,
        blank=True,
        region='CN'
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        verbose_name=_('头像')
    )

    class Meta:
        verbose_name = _('用户')
        verbose_name_plural = _('用户')

    def __str__(self):
        return f'{self.get_role_display()} - {self.username}'


class Department(models.Model):
    name = models.CharField(max_length=100, verbose_name=_('科室名称'))
    description = models.TextField(blank=True, verbose_name=_('科室描述'))
    floor = models.CharField(max_length=50, blank=True, verbose_name=_('楼层'))
    is_active = models.BooleanField(default=True, verbose_name=_('是否启用'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('科室')
        verbose_name_plural = _('科室')
        ordering = ['name']

    def __str__(self):
        return self.name
