from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import User
from apps.bookings.models import Booking
from apps.payments.models import PaymentOrder
from apps.services.models import ServiceRecord


class ConversionFunnel(models.Model):
    STAGE_CHOICES = (
        ('booking', '预约'),
        ('arrival', '到店'),
        ('service', '服务'),
        ('payment', '支付'),
        ('membership', '会员转化'),
    )
    
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='conversion_funnel')
    current_stage = models.CharField(_('当前阶段'), max_length=30, choices=STAGE_CHOICES, default='booking')
    arrival_time = models.DateTimeField(_('到店时间'), null=True, blank=True)
    service_start_time = models.DateTimeField(_('服务开始时间'), null=True, blank=True)
    service_end_time = models.DateTimeField(_('服务结束时间'), null=True, blank=True)
    payment_time = models.DateTimeField(_('支付时间'), null=True, blank=True)
    membership_converted = models.BooleanField(_('已转化会员'), default=False)
    conversion_time = models.DateTimeField(_('转化时间'), null=True, blank=True)
    service_record = models.OneToOneField(ServiceRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='conversion_funnel')
    payment_order = models.OneToOneField(PaymentOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name='conversion_funnel')
    converted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='conversions')
    conversion_amount = models.DecimalField(_('转化金额'), max_digits=10, decimal_places=2, default=0)
    follow_up_status = models.CharField(_('跟进状态'), max_length=30, default='pending')
    follow_up_notes = models.TextField(_('跟进备注'), null=True, blank=True)
    next_follow_up = models.DateTimeField(_('下次跟进时间'), null=True, blank=True)
    is_demo = models.BooleanField(_('演示数据'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('转化漏斗')
        verbose_name_plural = _('转化漏斗')

    def __str__(self):
        return f'{self.booking.order_no} - {self.get_current_stage_display()}'


class ConversionReport(models.Model):
    REPORT_TYPE_CHOICES = (
        ('daily', '日报'),
        ('weekly', '周报'),
        ('monthly', '月报'),
    )
    
    report_type = models.CharField(_('报表类型'), max_length=20, choices=REPORT_TYPE_CHOICES)
    report_date = models.DateField(_('报表日期'))
    start_date = models.DateField(_('统计开始日期'))
    end_date = models.DateField(_('统计结束日期'))
    
    total_bookings = models.IntegerField(_('预约总数'), default=0)
    total_arrivals = models.IntegerField(_('到店总数'), default=0)
    arrival_rate = models.DecimalField(_('到店率'), max_digits=5, decimal_places=2, default=0)
    total_services = models.IntegerField(_('服务总数'), default=0)
    service_completion_rate = models.DecimalField(_('服务完成率'), max_digits=5, decimal_places=2, default=0)
    total_payments = models.IntegerField(_('支付订单数'), default=0)
    payment_rate = models.DecimalField(_('支付转化率'), max_digits=5, decimal_places=2, default=0)
    new_memberships = models.IntegerField(_('新增会员数'), default=0)
    membership_conversion_rate = models.DecimalField(_('会员转化率'), max_digits=5, decimal_places=2, default=0)
    total_revenue = models.DecimalField(_('总收入'), max_digits=12, decimal_places=2, default=0)
    membership_revenue = models.DecimalField(_('会员收入'), max_digits=12, decimal_places=2, default=0)
    service_revenue = models.DecimalField(_('服务收入'), max_digits=12, decimal_places=2, default=0)
    average_order_value = models.DecimalField(_('客单价'), max_digits=10, decimal_places=2, default=0)
    
    cashier_discrepancies = models.IntegerField(_('收银差异数'), default=0)
    resolved_discrepancies = models.IntegerField(_('已处理差异数'), default=0)
    unresolved_discrepancies = models.IntegerField(_('未处理差异数'), default=0)
    
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='generated_reports')
    is_demo = models.BooleanField(_('演示数据'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)

    class Meta:
        ordering = ['-report_date']
        unique_together = ('report_type', 'report_date')
        verbose_name = _('转化报表')
        verbose_name_plural = _('转化报表')

    def __str__(self):
        return f'{self.get_report_type_display()} - {self.report_date}'


class ConversionReminder(models.Model):
    REMINDER_TYPE_CHOICES = (
        ('no_show', '未到店提醒'),
        ('pending_service', '待服务提醒'),
        ('pending_payment', '待支付提醒'),
        ('follow_up', '跟进提醒'),
        ('membership_promotion', '会员推广提醒'),
    )
    
    funnel = models.ForeignKey(ConversionFunnel, on_delete=models.CASCADE, related_name='reminders')
    reminder_type = models.CharField(_('提醒类型'), max_length=30, choices=REMINDER_TYPE_CHOICES)
    assigned_to = models.ForeignKey(User, on_delete=models.PROTECT, related_name='conversion_reminders', limit_choices_to={'role__in': ['staff', 'manager', 'admin']})
    scheduled_time = models.DateTimeField(_('计划提醒时间'))
    reminded_at = models.DateTimeField(_('实际提醒时间'), null=True, blank=True)
    is_completed = models.BooleanField(_('已完成'), default=False)
    completed_at = models.DateTimeField(_('完成时间'), null=True, blank=True)
    result = models.TextField(_('处理结果'), null=True, blank=True)
    notes = models.TextField(_('备注'), null=True, blank=True)
    is_demo = models.BooleanField(_('演示数据'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)

    class Meta:
        ordering = ['-scheduled_time']
        verbose_name = _('转化提醒')
        verbose_name_plural = _('转化提醒')

    def __str__(self):
        return f'{self.funnel.booking.order_no} - {self.get_reminder_type_display()}'


class StorePerformance(models.Model):
    date = models.DateField(_('日期'), unique=True)
    total_visitors = models.IntegerField(_('访客数'), default=0)
    new_customers = models.IntegerField(_('新客户数'), default=0)
    returning_customers = models.IntegerField(_('回头客数'), default=0)
    total_orders = models.IntegerField(_('订单总数'), default=0)
    total_revenue = models.DecimalField(_('总营收'), max_digits=12, decimal_places=2, default=0)
    membership_sales = models.IntegerField(_('会员销售数'), default=0)
    membership_revenue = models.DecimalField(_('会员营收'), max_digits=12, decimal_places=2, default=0)
    average_spend = models.DecimalField(_('人均消费'), max_digits=10, decimal_places=2, default=0)
    conversion_rate = models.DecimalField(_('转化率'), max_digits=5, decimal_places=2, default=0)
    is_demo = models.BooleanField(_('演示数据'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        ordering = ['-date']
        verbose_name = _('门店业绩')
        verbose_name_plural = _('门店业绩')

    def __str__(self):
        return f'{self.date} - ¥{self.total_revenue}'
