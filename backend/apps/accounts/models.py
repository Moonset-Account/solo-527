from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', '管理员'),
        ('manager', '店长'),
        ('cashier', '收银员'),
        ('staff', '店员'),
        ('member', '会员'),
    )
    
    role = models.CharField(_('角色'), max_length=20, choices=ROLE_CHOICES, default='member')
    phone = models.CharField(_('手机号'), max_length=20, unique=True)
    avatar = models.ImageField(_('头像'), upload_to='avatars/', null=True, blank=True)
    is_demo = models.BooleanField(_('演示数据'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('用户')
        verbose_name_plural = _('用户')

    def __str__(self):
        return f'{self.get_role_display()} - {self.username}'


class StaffProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    employee_id = models.CharField(_('工号'), max_length=50, unique=True)
    department = models.CharField(_('部门'), max_length=100, null=True, blank=True)
    position = models.CharField(_('职位'), max_length=100, null=True, blank=True)
    hire_date = models.DateField(_('入职日期'), null=True, blank=True)

    class Meta:
        verbose_name = _('员工档案')
        verbose_name_plural = _('员工档案')

    def __str__(self):
        return self.employee_id


class MemberProfile(models.Model):
    GENDER_CHOICES = (
        ('male', '男'),
        ('female', '女'),
        ('unknown', '未知'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='member_profile')
    gender = models.CharField(_('性别'), max_length=10, choices=GENDER_CHOICES, default='unknown')
    birthday = models.DateField(_('生日'), null=True, blank=True)
    address = models.TextField(_('地址'), null=True, blank=True)
    total_consumption = models.DecimalField(_('累计消费'), max_digits=10, decimal_places=2, default=0)
    total_points = models.IntegerField(_('累计积分'), default=0)
    current_points = models.IntegerField(_('当前积分'), default=0)
    level = models.CharField(_('会员等级'), max_length=50, default='普通会员')
    referrer = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='referred_members')

    class Meta:
        verbose_name = _('会员档案')
        verbose_name_plural = _('会员档案')

    def __str__(self):
        return f'{self.user.username} - {self.level}'


class Vehicle(models.Model):
    member = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vehicles')
    plate_number = models.CharField(_('车牌号'), max_length=20, unique=True)
    brand = models.CharField(_('品牌'), max_length=50)
    model = models.CharField(_('车型'), max_length=100)
    color = models.CharField(_('颜色'), max_length=30, null=True, blank=True)
    vin = models.CharField(_('车架号'), max_length=50, null=True, blank=True)
    is_default = models.BooleanField(_('默认车辆'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)

    class Meta:
        ordering = ['-is_default', '-created_at']
        verbose_name = _('车辆信息')
        verbose_name_plural = _('车辆信息')

    def __str__(self):
        return f'{self.plate_number} - {self.brand} {self.model}'
