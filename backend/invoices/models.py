from django.db import models
from django.utils.translation import gettext_lazy as _
from users.models import User
from suppliers.models import Supplier
from contracts.models import FrameworkContract


class Invoice(models.Model):
    INVOICE_TYPE_CHOICES = [
        ('vat_special', _('增值税专用发票')),
        ('vat_general', _('增值税普通发票')),
        ('electronic_special', _('电子专用发票')),
        ('electronic_general', _('电子普通发票')),
    ]

    STATUS_CHOICES = [
        ('draft', _('待提交')),
        ('pending_review', _('待审核')),
        ('reviewed', _('已审核')),
        ('pending_payment', _('待付款')),
        ('paid', _('已付款')),
        ('rejected', _('已驳回')),
        ('cancelled', _('已作废')),
    ]

    invoice_number = models.CharField(_('发票号码'), max_length=50, unique=True)
    invoice_code = models.CharField(_('发票代码'), max_length=50, blank=True)
    invoice_type = models.CharField(_('发票类型'), max_length=30, choices=INVOICE_TYPE_CHOICES)
    invoice_date = models.DateField(_('开票日期'))
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='invoices', verbose_name=_('供应商'))
    contract = models.ForeignKey(FrameworkContract, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices', verbose_name=_('关联合同'))
    total_amount = models.DecimalField(_('价税合计(元)'), max_digits=16, decimal_places=2)
    tax_amount = models.DecimalField(_('税额(元)'), max_digits=14, decimal_places=2, default=0)
    tax_rate = models.DecimalField(_('税率(%)'), max_digits=5, decimal_places=2, default=13)
    status = models.CharField(_('发票状态'), max_length=30, choices=STATUS_CHOICES, default='draft')
    due_date = models.DateField(_('到期付款日'), null=True, blank=True)
    actual_payment_date = models.DateField(_('实际付款日'), null=True, blank=True)
    payment_method = models.CharField(_('付款方式'), max_length=50, blank=True)
    invoice_file = models.FileField(_('发票文件'), upload_to='invoice_files/%Y/%m/', blank=True, null=True)
    remarks = models.TextField(_('备注'), blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_invoices', verbose_name=_('创建人'))
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_invoices', verbose_name=_('审核人'))
    paid_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='paid_invoices', verbose_name=_('付款人'))
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        verbose_name = _('发票')
        verbose_name_plural = _('发票')
        ordering = ['-invoice_date']

    def __str__(self):
        return f'{self.invoice_number} - {self.supplier.name}'


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items', verbose_name=_('发票'))
    item_name = models.CharField(_('项目名称'), max_length=200)
    specification = models.CharField(_('规格型号'), max_length=200, blank=True)
    unit = models.CharField(_('单位'), max_length=20, blank=True)
    quantity = models.DecimalField(_('数量'), max_digits=12, decimal_places=2)
    unit_price = models.DecimalField(_('单价(元)'), max_digits=12, decimal_places=2)
    amount = models.DecimalField(_('金额(元)'), max_digits=14, decimal_places=2)
    tax_rate = models.DecimalField(_('税率(%)'), max_digits=5, decimal_places=2, default=13)
    tax_amount = models.DecimalField(_('税额(元)'), max_digits=14, decimal_places=2, default=0)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)

    class Meta:
        verbose_name = _('发票明细')
        verbose_name_plural = _('发票明细')
        ordering = ['id']

    def __str__(self):
        return f'{self.invoice.invoice_number} - {self.item_name}'


class InvoiceStatusLog(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='status_logs', verbose_name=_('发票'))
    from_status = models.CharField(_('原状态'), max_length=30, blank=True)
    to_status = models.CharField(_('新状态'), max_length=30)
    remark = models.TextField(_('状态变更说明'), blank=True)
    operated_by = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name=_('操作人'))
    created_at = models.DateTimeField(_('操作时间'), auto_now_add=True)

    class Meta:
        verbose_name = _('发票状态日志')
        verbose_name_plural = _('发票状态日志')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.invoice.invoice_number}: {self.from_status} -> {self.to_status}'
