from django.db import models
from core.models import TimeStampedModel
from organization.models import Store
from materials.models import Material

class LossAggregation(TimeStampedModel):
    PERIOD_CHOICES = (
        ('day', '日'),
        ('week', '周'),
        ('month', '月'),
    )
    SHIFT_CHOICES = (
        ('morning', '早班'),
        ('afternoon', '中班'),
        ('evening', '晚班'),
        ('all', '全天'),
    )
    store = models.ForeignKey(Store, on_delete=models.CASCADE, verbose_name='门店', related_name='loss_aggs')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, verbose_name='原料', related_name='loss_aggs')
    period_type = models.CharField(max_length=20, choices=PERIOD_CHOICES, verbose_name='周期类型')
    period_date = models.DateField(verbose_name='周期日期')
    shift = models.CharField(max_length=20, choices=SHIFT_CHOICES, blank=True, verbose_name='班次')
    total_use = models.DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name='总领用')
    total_wastage = models.DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name='总报损')
    total_stocktake_diff = models.DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name='总盘点差异')
    total_sale_consume = models.DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name='总销售消耗')
    loss_rate = models.DecimalField(max_digits=8, decimal_places=4, default=0, verbose_name='损耗率')
    loss_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0, verbose_name='损耗金额')
    includes_trial = models.BooleanField(default=True, verbose_name='包含试营原料')

    class Meta:
        verbose_name = '损耗聚合'
        verbose_name_plural = verbose_name
        unique_together = ['store', 'material', 'period_type', 'period_date', 'shift', 'includes_trial']
        ordering = ['-period_date']

    def __str__(self):
        return f'{self.store.name} - {self.period_date} - {self.period_type}'

class CaliberConfig(TimeStampedModel):
    key = models.CharField(max_length=50, unique=True, verbose_name='配置键')
    value = models.TextField(verbose_name='配置值')
    description = models.TextField(blank=True, verbose_name='描述')

    class Meta:
        verbose_name = '口径配置'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.key
