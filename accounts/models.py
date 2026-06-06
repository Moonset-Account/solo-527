from django.db import models
from django.contrib.auth.models import User
from core.models import TimeStampedModel
from organization.models import Store, Region

class Role(TimeStampedModel):
    ROLE_CHOICES = (
        ('store_manager', '门店店长'),
        ('region_operator', '区域运营'),
        ('admin', '总部管理员'),
    )
    name = models.CharField(max_length=50, choices=ROLE_CHOICES, unique=True, verbose_name='角色名称')
    description = models.TextField(blank=True, verbose_name='角色描述')

    class Meta:
        verbose_name = '角色'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.get_name_display()

class UserProfile(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name='用户')
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, verbose_name='角色')
    store = models.ForeignKey(Store, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='所属门店', related_name='staff')
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='所属区域', related_name='staff')
    phone = models.CharField(max_length=20, blank=True, verbose_name='联系电话')

    class Meta:
        verbose_name = '用户档案'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.user.username} - {self.role}'

class Staff(TimeStampedModel):
    name = models.CharField(max_length=50, verbose_name='员工姓名')
    store = models.ForeignKey(Store, on_delete=models.CASCADE, verbose_name='所属门店', related_name='staff_members')
    position = models.CharField(max_length=50, blank=True, verbose_name='职位')
    phone = models.CharField(max_length=20, blank=True, verbose_name='联系电话')
    is_active = models.BooleanField(default=True, verbose_name='在职状态')

    class Meta:
        verbose_name = '员工'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name

class StaffShift(TimeStampedModel):
    SHIFT_CHOICES = (
        ('morning', '早班'),
        ('afternoon', '中班'),
        ('evening', '晚班'),
        ('all', '全天'),
    )
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, verbose_name='员工', related_name='shifts')
    store = models.ForeignKey(Store, on_delete=models.CASCADE, verbose_name='门店', related_name='shifts')
    shift_type = models.CharField(max_length=20, choices=SHIFT_CHOICES, verbose_name='班次类型')
    shift_date = models.DateField(verbose_name='班次日期')
    start_time = models.TimeField(null=True, blank=True, verbose_name='开始时间')
    end_time = models.TimeField(null=True, blank=True, verbose_name='结束时间')

    class Meta:
        verbose_name = '员工班次'
        verbose_name_plural = verbose_name
        unique_together = ['staff', 'shift_date']

    def __str__(self):
        return f'{self.staff.name} - {self.get_shift_type_display()} - {self.shift_date}'
