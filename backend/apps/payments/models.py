from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import User


class PaymentOrder(models.Model):
    ORDER_TYPE_CHOICES = (
        ('service', '服务消费'),
        ('membership', '会员购买'),
        ('recharge', '账户充值'),
        ('deposit', '押金'),
    )
    
    PAYMENT_METHOD_CHOICES = (
        ('wechat', '微信支付'),
        ('alipay', '支付宝'),
        ('cash', '现金'),
        ('card', '银行卡'),
        ('points', '积分抵扣'),
        ('balance', '余额支付'),
        ('other', '其他'),
    )
    
    STATUS_CHOICES = (
        ('pending', '待支付'),
        ('paid', '已支付'),
        ('failed', '支付失败'),
        ('refunded', '已退款'),
        ('partial_refunded', '部分退款'),
        ('cancelled', '已取消'),
    )
    
    order_no = models.CharField(_('订单号'), max_length=50, unique=True)
    order_type = models.CharField(_('订单类型'), max_length=30, choices=ORDER_TYPE_CHOICES)
    member = models.ForeignKey(User, on_delete=models.PROTECT, related_name='payment_orders')
    total_amount = models.DecimalField(_('订单金额'), max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(_('优惠金额'), max_digits=10, decimal_places=2, default=0)
    points_deduction = models.DecimalField(_('积分抵扣'), max_digits=10, decimal_places=2, default=0)
    balance_deduction = models.DecimalField(_('余额抵扣'), max_digits=10, decimal_places=2, default=0)
    payable_amount = models.DecimalField(_('应付金额'), max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(_('实付金额'), max_digits=10, decimal_places=2, default=0)
    refund_amount = models.DecimalField(_('退款金额'), max_digits=10, decimal_places=2, default=0)
    payment_method = models.CharField(_('支付方式'), max_length=30, choices=PAYMENT_METHOD_CHOICES, null=True, blank=True)
    status = models.CharField(_('订单状态'), max_length=30, choices=STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(_('第三方交易号'), max_length=100, null=True, blank=True)
    paid_at = models.DateTimeField(_('支付时间'), null=True, blank=True)
    cashier = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='cashier_orders', limit_choices_to={'role__in': ['cashier', 'manager', 'admin']})
    has_discrepancy = models.BooleanField(_('存在收银差异'), default=False)
    discrepancy_note = models.TextField(_('差异说明'), null=True, blank=True)
    discrepancy_resolved = models.BooleanField(_('差异已处理'), default=False)
    discrepancy_resolved_at = models.DateTimeField(_('差异处理时间'), null=True, blank=True)
    discrepancy_resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_discrepancies')
    notes = models.TextField(_('备注'), null=True, blank=True)
    is_demo = models.BooleanField(_('演示数据'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('支付订单')
        verbose_name_plural = _('支付订单')

    def __str__(self):
        return f'{self.order_no} - ¥{self.paid_amount}'


class PaymentTransaction(models.Model):
    TRANSACTION_TYPE_CHOICES = (
        ('payment', '支付'),
        ('refund', '退款'),
        ('recharge', '充值'),
        ('withdraw', '提现'),
    )
    
    order = models.ForeignKey(PaymentOrder, on_delete=models.CASCADE, related_name='transactions')
    transaction_no = models.CharField(_('交易流水号'), max_length=100, unique=True)
    transaction_type = models.CharField(_('交易类型'), max_length=30, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(_('交易金额'), max_digits=10, decimal_places=2)
    payment_method = models.CharField(_('支付方式'), max_length=30, choices=PaymentOrder.PAYMENT_METHOD_CHOICES)
    third_party_transaction_id = models.CharField(_('第三方交易号'), max_length=100, null=True, blank=True)
    status = models.CharField(_('交易状态'), max_length=30, choices=(
        ('success', '成功'),
        ('failed', '失败'),
        ('pending', '处理中'),
    ))
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    remark = models.TextField(_('备注'), null=True, blank=True)
    is_demo = models.BooleanField(_('演示数据'), default=False)
    created_at = models.DateTimeField(_('交易时间'), auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('交易流水')
        verbose_name_plural = _('交易流水')

    def __str__(self):
        return f'{self.transaction_no} - {self.get_transaction_type_display()}'


class CashierShift(models.Model):
    STATUS_CHOICES = (
        ('open', '营业中'),
        ('closed', '已交班'),
        ('reconciled', '已对账'),
    )
    
    shift_no = models.CharField(_('班次号'), max_length=50, unique=True)
    cashier = models.ForeignKey(User, on_delete=models.PROTECT, related_name='cashier_shifts', limit_choices_to={'role__in': ['cashier', 'manager', 'admin']})
    start_time = models.DateTimeField(_('开始时间'))
    end_time = models.DateTimeField(_('结束时间'), null=True, blank=True)
    opening_cash = models.DecimalField(_('备用金'), max_digits=10, decimal_places=2, default=0)
    expected_cash = models.DecimalField(_('应收现金'), max_digits=10, decimal_places=2, default=0)
    actual_cash = models.DecimalField(_('实收现金'), max_digits=10, decimal_places=2, null=True, blank=True)
    cash_discrepancy = models.DecimalField(_('现金差异'), max_digits=10, decimal_places=2, default=0)
    status = models.CharField(_('状态'), max_length=20, choices=STATUS_CHOICES, default='open')
    orders_count = models.IntegerField(_('订单数量'), default=0)
    total_amount = models.DecimalField(_('总金额'), max_digits=10, decimal_places=2, default=0)
    reconciliation_note = models.TextField(_('对账说明'), null=True, blank=True)
    is_demo = models.BooleanField(_('演示数据'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)

    class Meta:
        ordering = ['-start_time']
        verbose_name = _('收银班次')
        verbose_name_plural = _('收银班次')

    def __str__(self):
        return f'{self.shift_no} - {self.cashier.username}'
