from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from common.models import BaseModel


class User(AbstractUser, BaseModel):
    ROLE_CHOICES = (
        ('admin', '管理员'),
        ('representative', '居民代表'),
        ('volunteer', '志愿者'),
        ('resident', '普通居民'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='resident', verbose_name='角色')
    phone = models.CharField(max_length=20, blank=True, verbose_name='手机号')
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name='头像')
    address = models.CharField(max_length=255, blank=True, verbose_name='住址')
    community = models.CharField(max_length=100, blank=True, verbose_name='所属社区')
    building = models.CharField(max_length=50, blank=True, verbose_name='楼栋')
    unit = models.CharField(max_length=50, blank=True, verbose_name='单元')
    room_number = models.CharField(max_length=20, blank=True, verbose_name='房号')
    id_card = models.CharField(max_length=18, blank=True, verbose_name='身份证号')
    is_active_resident = models.BooleanField(default=True, verbose_name='是否有效居民')
    qualification_remark = models.TextField(blank=True, verbose_name='资格备注')

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.get_full_name() or self.username} ({self.get_role_display()})'
