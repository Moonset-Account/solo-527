from django.db import models
from django.contrib.auth.models import User
from core.models import TimeStampedModel
from organization.models import Store
from materials.models import Material

class Inventory(TimeStampedModel):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, verbose_name='门店', related_name='inventory_records')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, verbose_name='原料', related_name='inventory_records')
    quantity = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='数量')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='单价')
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, verbose_name='总金额')
    record_date = models.DateField(verbose_name='记录日期')
    batch_no = models.CharField(max_length=50, blank=True, verbose_name='批次号')

    class Meta:
        verbose_name = '进货记录'
        verbose_name_plural = verbose_name
        ordering = ['-record_date']

    def __str__(self):
        return f'{self.store.name} - {self.material.name} - {self.record_date}'

class MaterialUse(TimeStampedModel):
    SHIFT_CHOICES = (
        ('morning', '早班'),
        ('afternoon', '中班'),
        ('evening', '晚班'),
        ('all', '全天'),
    )
    store = models.ForeignKey(Store, on_delete=models.CASCADE, verbose_name='门店', related_name='use_records')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, verbose_name='原料', related_name='use_records')
    quantity = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='领用数量')
    shift = models.CharField(max_length=20, choices=SHIFT_CHOICES, blank=True, verbose_name='班次')
    record_date = models.DateField(verbose_name='记录日期')
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='操作人')

    class Meta:
        verbose_name = '原料领用'
        verbose_name_plural = verbose_name
        ordering = ['-record_date']

    def __str__(self):
        return f'{self.store.name} - {self.material.name} - {self.record_date}'

class Wastage(TimeStampedModel):
    SHIFT_CHOICES = (
        ('morning', '早班'),
        ('afternoon', '中班'),
        ('evening', '晚班'),
        ('all', '全天'),
    )
    WASTAGE_REASON = (
        ('expired', '过期'),
        ('damaged', '损坏'),
        ('spoilage', '变质'),
        ('operation', '操作失误'),
        ('other', '其他'),
    )
    store = models.ForeignKey(Store, on_delete=models.CASCADE, verbose_name='门店', related_name='wastage_records')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, verbose_name='原料', related_name='wastage_records')
    quantity = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='报损数量')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='单价')
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, verbose_name='报损金额')
    reason = models.CharField(max_length=20, choices=WASTAGE_REASON, blank=True, verbose_name='报损原因')
    shift = models.CharField(max_length=20, choices=SHIFT_CHOICES, blank=True, verbose_name='班次')
    record_date = models.DateField(verbose_name='记录日期')
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='操作人')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        verbose_name = '报损记录'
        verbose_name_plural = verbose_name
        ordering = ['-record_date']

    def __str__(self):
        return f'{self.store.name} - {self.material.name} - {self.record_date}'

class Stocktake(TimeStampedModel):
    SHIFT_CHOICES = (
        ('morning', '早班'),
        ('afternoon', '中班'),
        ('evening', '晚班'),
        ('all', '全天'),
    )
    store = models.ForeignKey(Store, on_delete=models.CASCADE, verbose_name='门店', related_name='stocktake_records')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, verbose_name='原料', related_name='stocktake_records')
    system_quantity = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='系统库存')
    actual_quantity = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='实际库存')
    diff_quantity = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='差异数量')
    diff_amount = models.DecimalField(max_digits=14, decimal_places=2, verbose_name='差异金额')
    shift = models.CharField(max_length=20, choices=SHIFT_CHOICES, blank=True, verbose_name='班次')
    record_date = models.DateField(verbose_name='盘点日期')

    class Meta:
        verbose_name = '盘点记录'
        verbose_name_plural = verbose_name
        ordering = ['-record_date']

    def __str__(self):
        return f'{self.store.name} - {self.material.name} - {self.record_date}'

class Sale(TimeStampedModel):
    SHIFT_CHOICES = (
        ('morning', '早班'),
        ('afternoon', '中班'),
        ('evening', '晚班'),
        ('all', '全天'),
    )
    store = models.ForeignKey(Store, on_delete=models.CASCADE, verbose_name='门店', related_name='sale_records')
    product_name = models.CharField(max_length=100, verbose_name='产品名称')
    material = models.ForeignKey(Material, on_delete=models.SET_NULL, null=True, verbose_name='关联原料', related_name='sale_records')
    quantity = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='销售数量')
    material_consume = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='原料消耗量')
    sale_amount = models.DecimalField(max_digits=14, decimal_places=2, verbose_name='销售金额')
    shift = models.CharField(max_length=20, choices=SHIFT_CHOICES, blank=True, verbose_name='班次')
    sale_date = models.DateField(verbose_name='销售日期')

    class Meta:
        verbose_name = '销售记录'
        verbose_name_plural = verbose_name
        ordering = ['-sale_date']

    def __str__(self):
        return f'{self.store.name} - {self.product_name} - {self.sale_date}'
