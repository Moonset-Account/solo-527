from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import User, Vehicle
from apps.services.models import ServiceItem, TestDriveSlot


class Booking(models.Model):
    BOOKING_TYPE_CHOICES = (
        ('service', '服务预约'),
        ('test_drive', '试驾预约'),
        ('membership', '会员办理'),
    )
    
    STATUS_CHOICES = (
        ('pending', '待确认'),
        ('confirmed', '已确认'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
        ('no_show', '未到店'),
    )
    
    booking_type = models.CharField(_('预约类型'), max_length=30, choices=BOOKING_TYPE_CHOICES)
    order_no = models.CharField(_('预约单号'), max_length=50, unique=True)
    member = models.ForeignKey(User, on_delete=models.PROTECT, related_name='bookings')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name='bookings', null=True, blank=True)
    service_item = models.ForeignKey(ServiceItem, on_delete=models.PROTECT, related_name='bookings', null=True, blank=True)
    test_drive_slot = models.ForeignKey(TestDriveSlot, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    booking_date = models.DateField(_('预约日期'))
    booking_time = models.TimeField(_('预约时间'))
    contact_name = models.CharField(_('联系人'), max_length=100)
    contact_phone = models.CharField(_('联系电话'), max_length=20)
    status = models.CharField(_('状态'), max_length=20, choices=STATUS_CHOICES, default='pending')
    source = models.CharField(_('预约来源'), max_length=50, default='online')
    notes = models.TextField(_('预约备注'), null=True, blank=True)
    assigned_staff = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_bookings')
    reminder_sent = models.BooleanField(_('已发送提醒'), default=False)
    arrival_time = models.DateTimeField(_('到店时间'), null=True, blank=True)
    is_demo = models.BooleanField(_('演示数据'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        ordering = ['-booking_date', '-booking_time']
        verbose_name = _('预约记录')
        verbose_name_plural = _('预约记录')

    def __str__(self):
        return f'{self.order_no} - {self.get_booking_type_display()}'


class BookingReminder(models.Model):
    REMINDER_TYPE_CHOICES = (
        ('sms', '短信'),
        ('wechat', '微信'),
        ('app', 'APP推送'),
        ('phone', '电话'),
    )
    
    STATUS_CHOICES = (
        ('pending', '待发送'),
        ('sent', '已发送'),
        ('failed', '发送失败'),
    )
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='reminders')
    reminder_type = models.CharField(_('提醒方式'), max_length=20, choices=REMINDER_TYPE_CHOICES)
    scheduled_time = models.DateTimeField(_('计划发送时间'))
    sent_time = models.DateTimeField(_('实际发送时间'), null=True, blank=True)
    status = models.CharField(_('状态'), max_length=20, choices=STATUS_CHOICES, default='pending')
    content = models.TextField(_('提醒内容'))
    error_message = models.TextField(_('错误信息'), null=True, blank=True)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)

    class Meta:
        ordering = ['-scheduled_time']
        verbose_name = _('预约提醒')
        verbose_name_plural = _('预约提醒')

    def __str__(self):
        return f'{self.booking.order_no} - {self.get_reminder_type_display()}'


class TimeSlot(models.Model):
    date = models.DateField(_('日期'))
    start_time = models.TimeField(_('开始时间'))
    end_time = models.TimeField(_('结束时间'))
    max_capacity = models.IntegerField(_('最大接待量'), default=5)
    current_bookings = models.IntegerField(_('当前预约数'), default=0)
    is_available = models.BooleanField(_('是否可用'), default=True)
    is_demo = models.BooleanField(_('演示数据'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)

    class Meta:
        ordering = ['date', 'start_time']
        unique_together = ('date', 'start_time', 'end_time')
        verbose_name = _('时段配置')
        verbose_name_plural = _('时段配置')

    def __str__(self):
        return f'{self.date} {self.start_time}-{self.end_time}'
