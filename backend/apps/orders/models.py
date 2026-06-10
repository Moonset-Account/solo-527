import uuid
from datetime import datetime

from django.db import models

from apps.properties.models import Room
from apps.users.models import User


def generate_order_no():
    return f'QH{datetime.now().strftime("%Y%m%d%H%M%S")}{uuid.uuid4().hex[:6].upper()}'


class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', '待确认'),
        ('confirmed', '已确认'),
        ('checked_in', '已入住'),
        ('checked_out', '已退房'),
        ('cancelled', '已取消'),
        ('no_show', '未入住'),
    )

    CONVERSION_STAGE_CHOICES = (
        ('inquiry', '咨询'),
        ('quoted', '已报价'),
        ('deposit_paid', '已付定金'),
        ('fully_paid', '已付清'),
        ('completed', '已完成'),
    )

    SOURCE_CHOICES = (
        ('direct', '官网直订'),
        ('wechat', '微信'),
        ('meituan', '美团'),
        ('ctrip', '携程'),
        ('other', '其他'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_no = models.CharField('订单号', max_length=32, unique=True, default=generate_order_no)
    room = models.ForeignKey(Room, on_delete=models.PROTECT, related_name='orders', verbose_name='房型')
    check_in_date = models.DateField('入住日期')
    check_out_date = models.DateField('退房日期')
    nights = models.IntegerField('入住晚数')
    adults = models.IntegerField('成人数量', default=2)
    children = models.IntegerField('儿童数量', default=0)

    guest_name = models.CharField('客人姓名', max_length=100)
    guest_phone = models.CharField('客人电话', max_length=20)
    guest_email = models.EmailField('客人邮箱', blank=True)
    guest_remarks = models.TextField('客人备注', blank=True)

    base_amount = models.DecimalField('房费', max_digits=10, decimal_places=2, default=0)
    extra_amount = models.DecimalField('其他费用', max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField('优惠金额', max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField('订单总额', max_digits=10, decimal_places=2, default=0)
    paid_amount = models.DecimalField('已付金额', max_digits=10, decimal_places=2, default=0)

    status = models.CharField('订单状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    conversion_stage = models.CharField(
        '转化阶段',
        max_length=20,
        choices=CONVERSION_STAGE_CHOICES,
        default='inquiry'
    )
    source = models.CharField('订单来源', max_length=20, choices=SOURCE_CHOICES, default='direct')

    internal_remarks = models.TextField('内部备注', blank=True)
    handled_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='handled_orders',
        verbose_name='处理人'
    )

    checked_in_at = models.DateTimeField('入住时间', null=True, blank=True)
    checked_out_at = models.DateTimeField('退房时间', null=True, blank=True)
    cancelled_at = models.DateTimeField('取消时间', null=True, blank=True)
    cancelled_reason = models.CharField('取消原因', max_length=200, blank=True)

    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'order'
        verbose_name = '订单'
        verbose_name_plural = '订单'
        indexes = [
            models.Index(fields=['status'], name='idx_orders_status'),
            models.Index(fields=['check_in_date'], name='idx_orders_checkin'),
            models.Index(fields=['conversion_stage'], name='idx_orders_conversion'),
            models.Index(fields=['order_no'], name='idx_orders_no'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.order_no} - {self.guest_name}'

    @property
    def is_paid(self):
        return self.paid_amount >= self.total_amount

    @property
    def remaining_amount(self):
        return self.total_amount - self.paid_amount


class OrderTimeline(models.Model):
    id = models.BigAutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='timeline', verbose_name='订单')
    action = models.CharField('操作', max_length=100)
    description = models.TextField('详情', blank=True)
    operator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='操作人'
    )
    created_at = models.DateTimeField('时间', auto_now_add=True)

    class Meta:
        db_table = 'order_timeline'
        verbose_name = '订单时间线'
        verbose_name_plural = '订单时间线'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.order.order_no} - {self.action}'


class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = (
        ('wechat', '微信支付'),
        ('alipay', '支付宝'),
        ('bank_transfer', '银行转账'),
        ('cash', '现金'),
        ('other', '其他'),
    )

    id = models.BigAutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments', verbose_name='订单')
    amount = models.DecimalField('支付金额', max_digits=10, decimal_places=2)
    method = models.CharField('支付方式', max_length=20, choices=PAYMENT_METHOD_CHOICES)
    transaction_no = models.CharField('交易流水号', max_length=100, blank=True)
    remarks = models.CharField('备注', max_length=200, blank=True)
    operator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name='操作人'
    )
    paid_at = models.DateTimeField('支付时间', auto_now_add=True)

    class Meta:
        db_table = 'payment'
        verbose_name = '支付记录'
        verbose_name_plural = '支付记录'
        ordering = ['-paid_at']

    def __str__(self):
        return f'{self.order.order_no} - ¥{self.amount}'
