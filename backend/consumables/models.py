from django.db import models
from django.utils.translation import gettext_lazy as _
from users.models import User


class ConsumableCategory(models.Model):
    name = models.CharField(_('品类名称'), max_length=100, unique=True)
    code = models.CharField(_('品类编码'), max_length=50, unique=True)
    description = models.TextField(_('描述'), blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children', verbose_name=_('上级品类'))
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        verbose_name = _('耗材品类')
        verbose_name_plural = _('耗材品类')
        ordering = ['code']

    def __str__(self):
        return f'{self.code} - {self.name}'


class ConsumableSpecification(models.Model):
    UNIT_CHOICES = [
        ('box', _('盒')),
        ('pack', _('包')),
        ('piece', _('个')),
        ('roll', _('卷')),
        ('ream', _('令')),
        ('kg', _('千克')),
        ('liter', _('升')),
        ('set', _('套')),
    ]

    STATUS_CHOICES = [
        ('active', _('在用')),
        ('inactive', _('停用')),
        ('obsolete', _('淘汰')),
    ]

    category = models.ForeignKey(ConsumableCategory, on_delete=models.PROTECT, related_name='specifications', verbose_name=_('品类'))
    name = models.CharField(_('耗材名称'), max_length=200)
    specification = models.CharField(_('规格型号'), max_length=200)
    brand = models.CharField(_('品牌'), max_length=100, blank=True)
    unit = models.CharField(_('单位'), max_length=20, choices=UNIT_CHOICES, default='box')
    unit_price = models.DecimalField(_('单价'), max_digits=12, decimal_places=2, default=0)
    status = models.CharField(_('状态'), max_length=20, choices=STATUS_CHOICES, default='active')
    description = models.TextField(_('备注说明'), blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_specifications', verbose_name=_('创建人'))
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        verbose_name = _('耗材规格')
        verbose_name_plural = _('耗材规格')
        ordering = ['-created_at']
        unique_together = ['category', 'name', 'specification']

    def __str__(self):
        return f'{self.name} - {self.specification}'


class SpecificationAttachment(models.Model):
    specification = models.ForeignKey(ConsumableSpecification, on_delete=models.CASCADE, related_name='attachments', verbose_name=_('耗材规格'))
    file = models.FileField(_('附件文件'), upload_to='specification_attachments/%Y/%m/')
    file_name = models.CharField(_('文件名'), max_length=255)
    file_type = models.CharField(_('文件类型'), max_length=50, blank=True)
    file_size = models.PositiveIntegerField(_('文件大小(字节)'), default=0)
    uploaded_by = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name=_('上传人'))
    created_at = models.DateTimeField(_('上传时间'), auto_now_add=True)

    class Meta:
        verbose_name = _('规格附件')
        verbose_name_plural = _('规格附件')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.specification} - {self.file_name}'


class MonthlyUsage(models.Model):
    specification = models.ForeignKey(ConsumableSpecification, on_delete=models.CASCADE, related_name='monthly_usages', verbose_name=_('耗材规格'))
    year = models.PositiveIntegerField(_('年份'))
    month = models.PositiveIntegerField(_('月份'))
    quantity = models.DecimalField(_('使用数量'), max_digits=12, decimal_places=2)
    actual_amount = models.DecimalField(_('实际金额'), max_digits=14, decimal_places=2, default=0)
    department = models.CharField(_('使用部门'), max_length=100, blank=True)
    recorded_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='recorded_usages', verbose_name=_('登记人'))
    remarks = models.TextField(_('备注'), blank=True)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        verbose_name = _('月度用量')
        verbose_name_plural = _('月度用量')
        ordering = ['-year', '-month']
        unique_together = ['specification', 'year', 'month', 'department']

    def __str__(self):
        return f'{self.specification} - {self.year}年{self.month}月'
