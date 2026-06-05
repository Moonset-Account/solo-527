from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel, User
from equipment.models import Equipment
from bookings.models import Booking
from auditlog.registry import auditlog


class ConsumableCategory(models.Model):
    name = models.CharField(_('类别名称'), max_length=100, unique=True)
    description = models.TextField(_('描述'), blank=True)
    sort_order = models.IntegerField(_('排序'), default=0)

    class Meta:
        verbose_name = _('耗材类别')
        verbose_name_plural = _('耗材类别')
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class Consumable(BaseModel):
    name = models.CharField(_('耗材名称'), max_length=200)
    category = models.ForeignKey(
        ConsumableCategory,
        on_delete=models.PROTECT,
        related_name='consumables',
        verbose_name=_('耗材类别')
    )
    sku = models.CharField(_('SKU编码'), max_length=50, unique=True)
    description = models.TextField(_('描述'), blank=True)
    unit = models.CharField(_('单位'), max_length=20)
    unit_price = models.DecimalField(_('单价'), max_digits=10, decimal_places=2, default=0)
    current_stock = models.IntegerField(_('当前库存'), default=0)
    min_stock = models.IntegerField(_('最低库存预警'), default=10)
    max_stock = models.IntegerField(_('最大库存'), default=100)
    location = models.CharField(_('存放位置'), max_length=200, blank=True)
    image = models.ImageField(_('图片'), upload_to='consumables/', blank=True, null=True)
    specifications = models.JSONField(_('规格参数'), default=dict, blank=True)
    is_active = models.BooleanField(_('启用'), default=True)

    class Meta:
        verbose_name = _('耗材')
        verbose_name_plural = _('耗材')
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['sku']),
            models.Index(fields=['category']),
            models.Index(fields=['current_stock']),
        ]

    def __str__(self):
        return f'{self.name} ({self.sku})'

    @property
    def is_low_stock(self):
        return self.current_stock <= self.min_stock


class ConsumableUsage(BaseModel):
    consumable = models.ForeignKey(
        Consumable,
        on_delete=models.PROTECT,
        related_name='usages',
        verbose_name=_('耗材')
    )
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='consumable_usages',
        verbose_name=_('使用人')
    )
    booking = models.ForeignKey(
        Booking,
        on_delete=models.SET_NULL,
        related_name='consumable_usages',
        null=True,
        blank=True,
        verbose_name=_('关联预约')
    )
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.SET_NULL,
        related_name='consumable_usages',
        null=True,
        blank=True,
        verbose_name=_('关联设备')
    )
    quantity = models.IntegerField(_('数量'))
    unit_price_at_usage = models.DecimalField(_('使用时单价'), max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(_('总费用'), max_digits=10, decimal_places=2)
    notes = models.TextField(_('备注'), blank=True)
    is_billed = models.BooleanField(_('已计费'), default=False)
    billed_at = models.DateTimeField(_('计费时间'), null=True, blank=True)

    class Meta:
        verbose_name = _('耗材使用记录')
        verbose_name_plural = _('耗材使用记录')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['consumable', 'created_at']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['is_billed']),
        ]

    def __str__(self):
        return f'{self.consumable.name} x {self.quantity} - {self.user.real_name}'


class ConsumableRestock(BaseModel):
    consumable = models.ForeignKey(
        Consumable,
        on_delete=models.PROTECT,
        related_name='restocks',
        verbose_name=_('耗材')
    )
    quantity = models.IntegerField(_('入库数量'))
    unit_cost = models.DecimalField(_('进货单价'), max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(_('总费用'), max_digits=10, decimal_places=2)
    supplier = models.CharField(_('供应商'), max_length=200, blank=True)
    batch_number = models.CharField(_('批次号'), max_length=100, blank=True)
    expiry_date = models.DateField(_('过期日期'), null=True, blank=True)
    notes = models.TextField(_('备注'), blank=True)

    class Meta:
        verbose_name = _('耗材入库记录')
        verbose_name_plural = _('耗材入库记录')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.consumable.name} +{self.quantity}'


auditlog.register(ConsumableCategory)
auditlog.register(Consumable)
auditlog.register(ConsumableUsage)
auditlog.register(ConsumableRestock)
