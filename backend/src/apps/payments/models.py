from django.db import models
from core.models import BaseModel


class PaymentItem(BaseModel):
    name = models.CharField('收费项目名称', max_length=100)
    description = models.TextField('描述', blank=True)
    default_amount = models.DecimalField('默认金额', max_digits=10, decimal_places=2)
    is_active = models.BooleanField('是否启用', default=True)

    class Meta:
        verbose_name = '收费项目'
        verbose_name_plural = verbose_name
        ordering = ['name']

    def __str__(self):
        return self.name


class Invoice(BaseModel):
    STATUS_CHOICES = (
        ('pending', '待缴费'),
        ('paid', '已缴费'),
        ('overdue', '已逾期'),
        ('cancelled', '已取消'),
        ('refunded', '已退款'),
    )
    child = models.ForeignKey('children.Child', on_delete=models.CASCADE, related_name='invoices', verbose_name='儿童')
    item = models.ForeignKey(PaymentItem, on_delete=models.PROTECT, related_name='invoices', verbose_name='收费项目')
    amount = models.DecimalField('应缴金额', max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField('实缴金额', max_digits=10, decimal_places=2, default=0)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    bill_date = models.DateField('账单日期')
    due_date = models.DateField('到期日期')
    paid_at = models.DateTimeField('缴费时间', null=True, blank=True)
    paid_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='paid_invoices', verbose_name='确认人')
    payment_method = models.CharField('缴费方式', max_length=50, blank=True)
    notes = models.TextField('备注', blank=True)
    reminder_sent = models.BooleanField('已发送提醒', default=False)
    last_reminder_at = models.DateTimeField('最后提醒时间', null=True, blank=True)

    class Meta:
        verbose_name = '缴费账单'
        verbose_name_plural = verbose_name
        ordering = ['-bill_date']

    def __str__(self):
        return f'{self.child.name} - {self.item.name}'

    @property
    def remaining_amount(self):
        return self.amount - self.paid_amount


class PaymentRecord(BaseModel):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payment_records', verbose_name='账单')
    amount = models.DecimalField('缴费金额', max_digits=10, decimal_places=2)
    payment_method = models.CharField('缴费方式', max_length=50)
    transaction_id = models.CharField('交易流水号', max_length=100, blank=True)
    paid_at = models.DateTimeField('缴费时间', auto_now_add=True)
    paid_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='payment_records', verbose_name='操作人')
    notes = models.TextField('备注', blank=True)

    class Meta:
        verbose_name = '缴费记录'
        verbose_name_plural = verbose_name
        ordering = ['-paid_at']

    def __str__(self):
        return f'{self.invoice.child.name} - {self.amount}元'
