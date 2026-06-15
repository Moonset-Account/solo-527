from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import User, Vehicle


class ServiceCategory(models.Model):
    name = models.CharField(_('分类名称'), max_length=100)
    description = models.TextField(_('分类描述'), null=True, blank=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    sort_order = models.IntegerField(_('排序'), default=0)
    is_active = models.BooleanField(_('是否启用'), default=True)
    is_demo = models.BooleanField(_('演示数据'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        ordering = ['sort_order', '-created_at']
        verbose_name = _('服务分类')
        verbose_name_plural = _('服务分类')

    def __str__(self):
        return self.name


class ServiceItem(models.Model):
    SERVICE_TYPE_CHOICES = (
        ('car_wash', '洗车'),
        ('beauty', '美容'),
        ('maintenance', '保养'),
        ('repair', '维修'),
        ('test_drive', '试驾'),
        ('other', '其他'),
    )
    
    name = models.CharField(_('服务名称'), max_length=200)
    description = models.TextField(_('服务描述'), null=True, blank=True)
    short_description = models.CharField(_('简短描述'), max_length=500, null=True, blank=True)
    category = models.ForeignKey(ServiceCategory, on_delete=models.PROTECT, related_name='services')
    service_type = models.CharField(_('服务类型'), max_length=30, choices=SERVICE_TYPE_CHOICES)
    price = models.DecimalField(_('价格'), max_digits=10, decimal_places=2)
    member_price = models.DecimalField(_('会员价'), max_digits=10, decimal_places=2, null=True, blank=True)
    duration_minutes = models.IntegerField(_('预计时长(分钟)'), default=30)
    images = models.JSONField(_('图片列表'), default=list, blank=True)
    is_available = models.BooleanField(_('是否可用'), default=True)
    is_demo = models.BooleanField(_('演示数据'), default=False)
    sort_order = models.IntegerField(_('排序'), default=0)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        ordering = ['sort_order', '-created_at']
        verbose_name = _('服务项目')
        verbose_name_plural = _('服务项目')

    def __str__(self):
        return f'{self.name} - ¥{self.price}'


class TestDriveSlot(models.Model):
    STATUS_CHOICES = (
        ('available', '可预约'),
        ('booked', '已预约'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
    )
    
    service_item = models.ForeignKey(ServiceItem, on_delete=models.CASCADE, related_name='test_drive_slots', limit_choices_to={'service_type': 'test_drive'})
    date = models.DateField(_('日期'))
    start_time = models.TimeField(_('开始时间'))
    end_time = models.TimeField(_('结束时间'))
    vehicle_model = models.CharField(_('试驾车型'), max_length=200)
    location = models.CharField(_('试驾地点'), max_length=200)
    max_bookings = models.IntegerField(_('最大预约数'), default=1)
    current_bookings = models.IntegerField(_('当前预约数'), default=0)
    status = models.CharField(_('状态'), max_length=20, choices=STATUS_CHOICES, default='available')
    is_demo = models.BooleanField(_('演示数据'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        ordering = ['date', 'start_time']
        verbose_name = _('试驾时段')
        verbose_name_plural = _('试驾时段')
        unique_together = ('service_item', 'date', 'start_time', 'vehicle_model')

    def __str__(self):
        return f'{self.vehicle_model} - {self.date} {self.start_time}-{self.end_time}'


class ServiceRecord(models.Model):
    STATUS_CHOICES = (
        ('pending', '待服务'),
        ('in_progress', '服务中'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
        ('refunded', '已退款'),
    )
    
    member = models.ForeignKey(User, on_delete=models.PROTECT, related_name='service_records')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name='service_records')
    service_item = models.ForeignKey(ServiceItem, on_delete=models.PROTECT, related_name='service_records')
    booking = models.OneToOneField('bookings.Booking', on_delete=models.SET_NULL, null=True, blank=True, related_name='service_record')
    status = models.CharField(_('状态'), max_length=20, choices=STATUS_CHOICES, default='pending')
    staff = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_services', limit_choices_to={'role__in': ['staff', 'manager']})
    start_time = models.DateTimeField(_('开始时间'), null=True, blank=True)
    end_time = models.DateTimeField(_('结束时间'), null=True, blank=True)
    actual_duration = models.IntegerField(_('实际时长(分钟)'), null=True, blank=True)
    amount = models.DecimalField(_('服务金额'), max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(_('优惠金额'), max_digits=10, decimal_places=2, default=0)
    final_amount = models.DecimalField(_('实收金额'), max_digits=10, decimal_places=2, default=0)
    remarks = models.TextField(_('服务备注'), null=True, blank=True)
    check_items = models.JSONField(_('检查项目'), default=list, blank=True)
    is_demo = models.BooleanField(_('演示数据'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('服务记录')
        verbose_name_plural = _('服务记录')

    def __str__(self):
        return f'{self.service_item.name} - {self.vehicle.plate_number}'
