from django.db import models
from core.models import TimeStampedModel

class MaterialCategory(TimeStampedModel):
    name = models.CharField(max_length=100, verbose_name='分类名称')
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='上级分类', related_name='children')
    sort_order = models.IntegerField(default=0, verbose_name='排序')

    class Meta:
        verbose_name = '原料分类'
        verbose_name_plural = verbose_name
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.name

class Material(TimeStampedModel):
    name = models.CharField(max_length=100, verbose_name='原料名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='原料编码')
    category = models.ForeignKey(MaterialCategory, on_delete=models.SET_NULL, null=True, verbose_name='原料分类', related_name='materials')
    unit = models.CharField(max_length=20, verbose_name='计量单位')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='单价')
    is_trial = models.BooleanField(default=False, verbose_name='是否试营原料')

    class Meta:
        verbose_name = '原料'
        verbose_name_plural = verbose_name
        ordering = ['code']

    def __str__(self):
        return f'{self.code} - {self.name}'

class TrialProduct(TimeStampedModel):
    material = models.OneToOneField(Material, on_delete=models.CASCADE, verbose_name='原料', related_name='trial_info')
    start_date = models.DateField(verbose_name='试营开始日期')
    end_date = models.DateField(null=True, blank=True, verbose_name='试营结束日期')
    store_ids = models.JSONField(default=list, verbose_name='适用门店ID列表')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        verbose_name = '试营原料'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.material.name} - 试营'
