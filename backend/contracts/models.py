from django.db import models
from django.utils.translation import gettext_lazy as _
from users.models import User
from suppliers.models import Supplier
from consumables.models import ConsumableCategory, ConsumableSpecification


class FrameworkContract(models.Model):
    STATUS_CHOICES = [
        ('draft', _('草稿')),
        ('pending_approval', _('待审批')),
        ('active', _('执行中')),
        ('expiring_soon', _('即将到期')),
        ('expired', _('已到期')),
        ('terminated', _('已终止')),
    ]

    PAYMENT_TERMS_CHOICES = [
        ('monthly', _('月结')),
        ('quarterly', _('季结')),
        ('semiannual', _('半年结')),
        ('annual', _('年结')),
        ('delivery', _('货到付款')),
    ]

    contract_number = models.CharField(_('合同编号'), max_length=50, unique=True)
    title = models.CharField(_('合同名称'), max_length=200)
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='contracts', verbose_name=_('供应商'))
    project_manager = models.ForeignKey(User, on_delete=models.PROTECT, related_name='managed_contracts', verbose_name=_('项目负责人'))
    start_date = models.DateField(_('合同开始日期'))
    end_date = models.DateField(_('合同结束日期'))
    total_amount = models.DecimalField(_('合同总金额(元)'), max_digits=16, decimal_places=2, default=0)
    minimum_order_amount = models.DecimalField(_('最小起订金额(元)'), max_digits=14, decimal_places=2, default=0)
    payment_terms = models.CharField(_('付款方式'), max_length=30, choices=PAYMENT_TERMS_CHOICES, default='monthly')
    status = models.CharField(_('合同状态'), max_length=30, choices=STATUS_CHOICES, default='draft')
    categories = models.ManyToManyField(ConsumableCategory, related_name='contracts', verbose_name=_('覆盖品类'))
    specifications = models.ManyToManyField(ConsumableSpecification, related_name='contracts', verbose_name=_('覆盖规格'), blank=True)
    terms_and_conditions = models.TextField(_('合同条款'), blank=True)
    delivery_terms = models.TextField(_('交货条款'), blank=True)
    quality_requirements = models.TextField(_('质量要求'), blank=True)
    penalty_clause = models.TextField(_('违约条款'), blank=True)
    contract_file = models.FileField(_('合同文件'), upload_to='contract_files/%Y/%m/', blank=True, null=True)
    signed_date = models.DateField(_('签订日期'), null=True, blank=True)
    signing_location = models.CharField(_('签订地点'), max_length=100, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_contracts', verbose_name=_('创建人'))
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        verbose_name = _('框架协议')
        verbose_name_plural = _('框架协议')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.contract_number} - {self.title}'


class ContractPrice(models.Model):
    contract = models.ForeignKey(FrameworkContract, on_delete=models.CASCADE, related_name='prices', verbose_name=_('所属合同'))
    specification = models.ForeignKey(ConsumableSpecification, on_delete=models.CASCADE, related_name='contract_prices', verbose_name=_('耗材规格'))
    unit_price = models.DecimalField(_('协议单价(元)'), max_digits=12, decimal_places=2)
    minimum_quantity = models.DecimalField(_('最小采购量'), max_digits=12, decimal_places=2, default=0)
    discount_rate = models.DecimalField(_('折扣率(%)'), max_digits=5, decimal_places=2, default=0)
    effective_date = models.DateField(_('生效日期'))
    expiration_date = models.DateField(_('失效日期'), null=True, blank=True)
    is_active = models.BooleanField(_('是否有效'), default=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name=_('创建人'))
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        verbose_name = _('合同价格')
        verbose_name_plural = _('合同价格')
        ordering = ['-created_at']
        unique_together = ['contract', 'specification', 'effective_date']

    def __str__(self):
        return f'{self.contract.contract_number} - {self.specification} - {self.unit_price}'


class PriceHistory(models.Model):
    specification = models.ForeignKey(ConsumableSpecification, on_delete=models.CASCADE, related_name='price_histories', verbose_name=_('耗材规格'))
    contract = models.ForeignKey(FrameworkContract, on_delete=models.SET_NULL, null=True, blank=True, related_name='price_histories', verbose_name=_('来源合同'))
    unit_price = models.DecimalField(_('单价(元)'), max_digits=12, decimal_places=2)
    price_date = models.DateField(_('价格日期'))
    source = models.CharField(_('价格来源'), max_length=100, default='contract')
    change_reason = models.CharField(_('变动原因'), max_length=300, blank=True)
    recorded_by = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name=_('记录人'))
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)

    class Meta:
        verbose_name = _('价格历史')
        verbose_name_plural = _('价格历史')
        ordering = ['-price_date']

    def __str__(self):
        return f'{self.specification} - {self.price_date} - {self.unit_price}'


class ContractRenewal(models.Model):
    STATUS_CHOICES = [
        ('pending', _('待处理')),
        ('in_progress', _('处理中')),
        ('renewed', _('已续签')),
        ('not_renewed', _('不续签')),
    ]

    original_contract = models.ForeignKey(FrameworkContract, on_delete=models.CASCADE, related_name='renewals', verbose_name=_('原合同'))
    new_contract = models.ForeignKey(FrameworkContract, on_delete=models.SET_NULL, null=True, blank=True, related_name='renewed_from', verbose_name=_('新合同'))
    renewal_recommendation = models.TextField(_('续签建议'), blank=True)
    decision = models.CharField(_('处理结果'), max_length=30, choices=STATUS_CHOICES, default='pending')
    decision_reason = models.TextField(_('决策原因'), blank=True)
    handled_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='handled_renewals', verbose_name=_('处理人'))
    handled_date = models.DateField(_('处理日期'), null=True, blank=True)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        verbose_name = _('合同续签')
        verbose_name_plural = _('合同续签')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.original_contract.contract_number} - 续签申请'
