from django.db import models
from django.utils.translation import gettext_lazy as _
from users.models import User


class Supplier(models.Model):
    STATUS_CHOICES = [
        ('active', _('合作中')),
        ('suspended', _('暂停合作')),
        ('blacklisted', _('黑名单')),
        ('potential', _('潜在供应商')),
    ]

    CREDIT_RATING_CHOICES = [
        ('aaa', _('AAA 优秀')),
        ('aa', _('AA 良好')),
        ('a', _('A 一般')),
        ('b', _('B 合格')),
        ('c', _('C 风险')),
        ('d', _('D 不合格')),
    ]

    name = models.CharField(_('供应商名称'), max_length=200)
    unified_social_credit_code = models.CharField(_('统一社会信用代码'), max_length=50, unique=True)
    legal_person = models.CharField(_('法人代表'), max_length=50, blank=True)
    contact_person = models.CharField(_('联系人'), max_length=50)
    contact_phone = models.CharField(_('联系电话'), max_length=20)
    contact_email = models.EmailField(_('联系邮箱'), blank=True)
    address = models.CharField(_('地址'), max_length=300, blank=True)
    registered_capital = models.DecimalField(_('注册资本(万元)'), max_digits=18, decimal_places=2, null=True, blank=True)
    establishment_date = models.DateField(_('成立日期'), null=True, blank=True)
    business_scope = models.TextField(_('经营范围'), blank=True)
    status = models.CharField(_('合作状态'), max_length=20, choices=STATUS_CHOICES, default='potential')
    credit_rating = models.CharField(_('信用评级'), max_length=10, choices=CREDIT_RATING_CHOICES, blank=True)
    bank_account = models.CharField(_('银行账户'), max_length=100, blank=True)
    bank_name = models.CharField(_('开户银行'), max_length=100, blank=True)
    tax_number = models.CharField(_('纳税人识别号'), max_length=50, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_suppliers', verbose_name=_('创建人'))
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        verbose_name = _('供应商')
        verbose_name_plural = _('供应商')
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def get_current_risk_level(self):
        risks = self.risks.filter(status='open').order_by('-risk_level')
        if risks.exists():
            return risks.first().risk_level
        return 'low'


class SupplierRisk(models.Model):
    RISK_LEVEL_CHOICES = [
        ('critical', _('严重')),
        ('high', _('高')),
        ('medium', _('中')),
        ('low', _('低')),
    ]

    RISK_TYPE_CHOICES = [
        ('financial', _('财务风险')),
        ('operational', _('经营风险')),
        ('legal', _('法律风险')),
        ('quality', _('质量风险')),
        ('delivery', _('交付风险')),
        ('reputation', _('声誉风险')),
        ('compliance', _('合规风险')),
    ]

    STATUS_CHOICES = [
        ('open', _('待处理')),
        ('monitoring', _('监控中')),
        ('resolved', _('已解决')),
        ('closed', _('已关闭')),
    ]

    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='risks', verbose_name=_('供应商'))
    risk_type = models.CharField(_('风险类型'), max_length=30, choices=RISK_TYPE_CHOICES)
    risk_level = models.CharField(_('风险等级'), max_length=20, choices=RISK_LEVEL_CHOICES)
    title = models.CharField(_('风险标题'), max_length=200)
    description = models.TextField(_('风险详情'))
    source = models.CharField(_('风险来源'), max_length=100, blank=True)
    discovered_date = models.DateField(_('发现日期'))
    expected_resolution_date = models.DateField(_('预计解决日期'), null=True, blank=True)
    actual_resolution_date = models.DateField(_('实际解决日期'), null=True, blank=True)
    status = models.CharField(_('处理状态'), max_length=20, choices=STATUS_CHOICES, default='open')
    mitigation_measures = models.TextField(_('缓解措施'), blank=True)
    identified_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='identified_risks', verbose_name=_('发现人'))
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_risks', verbose_name=_('处理人'))
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        verbose_name = _('供应商风险')
        verbose_name_plural = _('供应商风险')
        ordering = ['-risk_level', '-created_at']

    def __str__(self):
        return f'{self.supplier.name} - {self.title} ({self.get_risk_level_display()})'


class SupplierRiskEvidence(models.Model):
    risk = models.ForeignKey(SupplierRisk, on_delete=models.CASCADE, related_name='evidences', verbose_name=_('风险记录'))
    file = models.FileField(_('证据文件'), upload_to='risk_evidences/%Y/%m/')
    file_name = models.CharField(_('文件名'), max_length=255)
    description = models.CharField(_('说明'), max_length=300, blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name=_('上传人'))
    created_at = models.DateTimeField(_('上传时间'), auto_now_add=True)

    class Meta:
        verbose_name = _('风险证据')
        verbose_name_plural = _('风险证据')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.risk} - {self.file_name}'


class SupplierEvaluation(models.Model):
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='evaluations', verbose_name=_('供应商'))
    evaluation_period = models.CharField(_('评估周期'), max_length=50)
    quality_score = models.DecimalField(_('质量评分'), max_digits=5, decimal_places=2, default=0)
    delivery_score = models.DecimalField(_('交付评分'), max_digits=5, decimal_places=2, default=0)
    price_score = models.DecimalField(_('价格评分'), max_digits=5, decimal_places=2, default=0)
    service_score = models.DecimalField(_('服务评分'), max_digits=5, decimal_places=2, default=0)
    overall_score = models.DecimalField(_('综合评分'), max_digits=5, decimal_places=2, default=0)
    comments = models.TextField(_('评价意见'), blank=True)
    evaluated_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='supplier_evaluations', verbose_name=_('评估人'))
    evaluation_date = models.DateField(_('评估日期'), auto_now_add=True)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)

    class Meta:
        verbose_name = _('供应商评估')
        verbose_name_plural = _('供应商评估')
        ordering = ['-evaluation_date']

    def __str__(self):
        return f'{self.supplier.name} - {self.evaluation_period} ({self.overall_score})'
