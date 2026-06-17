from django.db import models
from django.conf import settings
from apps.projects.models import Project


class Quotation(models.Model):
    """报价单"""
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('submitted', '已提交'),
        ('confirmed', '客户已确认'),
        ('rejected', '客户拒绝'),
        ('expired', '已过期'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='quotations', verbose_name='项目')
    version = models.CharField('版本号', max_length=20, default='v1.0')
    title = models.CharField('报价标题', max_length=200)
    valid_days = models.IntegerField('有效期(天)', default=30)
    expire_date = models.DateField('过期日期', null=True, blank=True)

    material_cost = models.DecimalField('材料费', max_digits=14, decimal_places=2, default=0)
    labor_cost = models.DecimalField('人工费', max_digits=14, decimal_places=2, default=0)
    equipment_cost = models.DecimalField('设备费', max_digits=14, decimal_places=2, default=0)
    management_fee = models.DecimalField('管理费', max_digits=14, decimal_places=2, default=0)
    profit = models.DecimalField('利润', max_digits=14, decimal_places=2, default=0)
    tax = models.DecimalField('税金', max_digits=14, decimal_places=2, default=0)
    discount = models.DecimalField('优惠金额', max_digits=14, decimal_places=2, default=0)
    total_amount = models.DecimalField('报价总额', max_digits=14, decimal_places=2, default=0)

    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='draft')
    is_current = models.BooleanField('当前版本', default=True)

    remark = models.TextField('备注', blank=True)
    terms = models.TextField('报价条款', blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='created_quotations', verbose_name='创建人', null=True, blank=True
    )
    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='confirmed_quotations', verbose_name='确认人', null=True, blank=True
    )
    confirmed_at = models.DateTimeField('确认时间', null=True, blank=True)
    client_confirm_signature = models.ImageField('客户签字', upload_to='signatures/', null=True, blank=True)

    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '报价单'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.project.code} - {self.title} ({self.version})'

    def calculate_total(self):
        subtotal = self.material_cost + self.labor_cost + self.equipment_cost + self.management_fee + self.profit
        self.total_amount = subtotal + self.tax - self.discount
        return self.total_amount


class QuotationItem(models.Model):
    """报价明细项"""
    CATEGORY_CHOICES = [
        ('material', '材料'),
        ('labor', '人工'),
        ('equipment', '设备'),
        ('other', '其他'),
    ]

    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='items', verbose_name='报价单')
    category = models.CharField('类别', max_length=20, choices=CATEGORY_CHOICES)
    name = models.CharField('项目名称', max_length=200)
    specification = models.CharField('规格/说明', max_length=500, blank=True)
    unit = models.CharField('单位', max_length=20, blank=True)
    quantity = models.DecimalField('数量', max_digits=12, decimal_places=2, default=0)
    unit_price = models.DecimalField('单价', max_digits=12, decimal_places=2, default=0)
    amount = models.DecimalField('小计', max_digits=14, decimal_places=2, default=0)
    remark = models.CharField('备注', max_length=500, blank=True)
    sort_order = models.IntegerField('排序', default=0)

    class Meta:
        verbose_name = '报价明细'
        verbose_name_plural = verbose_name
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.name

    def calculate_amount(self):
        self.amount = self.quantity * self.unit_price
        return self.amount


class QuotationExtra(models.Model):
    """报价增项"""
    quotation = models.ForeignKey(Quotation, on_delete=models.CASCADE, related_name='extras', verbose_name='报价单')
    name = models.CharField('增项名称', max_length=200)
    description = models.TextField('增项说明')
    reason = models.TextField('增项原因', blank=True)
    amount = models.DecimalField('增项金额', max_digits=14, decimal_places=2, default=0)
    is_confirmed = models.BooleanField('客户确认', default=False)
    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='confirmed_extras', verbose_name='确认人', null=True, blank=True
    )
    confirmed_at = models.DateTimeField('确认时间', null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='created_extras', verbose_name='提出人', null=True, blank=True
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '报价增项'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.quotation.title} - {self.name}'
