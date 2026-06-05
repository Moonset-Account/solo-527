from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', '管理员'),
        ('teacher', '教师'),
        ('parent', '家长'),
    ]
    role = models.CharField('角色', max_length=20, choices=ROLE_CHOICES, default='teacher')
    phone = models.CharField('手机号', max_length=20, blank=True, default='')
    avatar = models.ImageField('头像', upload_to='avatars/', blank=True, null=True)

    class Meta:
        db_table = 'accounts_user'
        verbose_name = '用户'
        verbose_name_plural = verbose_name
        indexes = [
            models.Index(fields=['role'], name='idx_user_role'),
            models.Index(fields=['phone'], name='idx_user_phone'),
        ]

    def __str__(self):
        return f'{self.get_role_display()} - {self.username}'
