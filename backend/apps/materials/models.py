from django.db import models
from django.conf import settings
from apps.projects.models import Project


class Material(models.Model):
    """材料主数据"""
    CATEGORY_CHOICES = [
        ('structure', '结构材料'),
        ('decoration', '装饰材料'),
        ('electrical', '电气材料'),
        ('plumbing', '水暖材料'),
        ('hardware', '五金配件'),
        ('chemical', '化工材料'),
        ('other', '其他'),
    ]

    code = models.CharField('材料编码', max_length=50, unique=True)
    name = models.CharField('材料名称', max_length=200)
    category = models.CharField('分类', max_length=20, choices=CATEGORY_CHOICES)
    specification = models.CharField('规格型号', max_length=200, blank=True)
    brand = models.CharField('品牌', max_length=100, blank=True)
    unit = models.CharField('单位', max_length=20)
    unit_price = models.DecimalField('参考单价', max_digits=12, decimal_places=2, default=0)
    stock_quantity = models.DecimalField('库存数量', max_digits=12, decimal_places=2, default=0)
    description = models.TextField('描述', blank=True)
    is_active = models.BooleanField('启用', default=True)

    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '材料'
        verbose_name_plural = verbose_name
        ordering = ['code']

    def __str__(self):
        return f'{self.code} - {self.name}'


class MaterialUsage(models.Model):
    """材料领用记录"""
    STATUS_CHOICES = [
        ('pending', '待审核'),
        ('approved', '已批准'),
        ('rejected', '已拒绝'),
        ('returned', '已退回'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='material_usages', verbose_name='项目')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='usages', verbose_name='材料')
    quantity = models.DecimalField('数量', max_digits=12, decimal_places=2)
    unit_price = models.DecimalField('单价', max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField('总金额', max_digits=14, decimal_places=2, default=0)
    purpose = models.CharField('用途', max_length=500, blank=True)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='requested_materials', verbose_name='申请人', null=True, blank=True
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='approved_materials', verbose_name='审核人', null=True, blank=True
    )
    approved_at = models.DateTimeField('审核时间', null=True, blank=True)

    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '材料领用'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.project.code} - {self.material.name} x {self.quantity}'

    def calculate_total(self):
        self.total_amount = self.quantity * self.unit_price
        return self.total_amount


class MaterialPurchase(models.Model):
    """材料采购记录"""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='material_purchases', verbose_name='项目', null=True, blank=True)
    supplier = models.CharField('供应商', max_length=200)
    invoice_no = models.CharField('发票号', max_length=100, blank=True)
    total_amount = models.DecimalField('总金额', max_digits=14, decimal_places=2, default=0)
    purchase_date = models.DateField('采购日期')
    remark = models.TextField('备注', blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='created_purchases', verbose_name='创建人', null=True, blank=True
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '材料采购'
        verbose_name_plural = verbose_name
        ordering = ['-purchase_date']

    def __str__(self):
        return f'{self.supplier} - {self.total_amount}'


class MaterialPurchaseItem(models.Model):
    """采购明细"""
    purchase = models.ForeignKey(MaterialPurchase, on_delete=models.CASCADE, related_name='items', verbose_name='采购单')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='purchase_items', verbose_name='材料')
    quantity = models.DecimalField('数量', max_digits=12, decimal_places=2)
    unit_price = models.DecimalField('单价', max_digits=12, decimal_places=2)
    total_amount = models.DecimalField('金额', max_digits=14, decimal_places=2, default=0)

    class Meta:
        verbose_name = '采购明细'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.material.name} x {self.quantity}'

    def calculate_total(self):
        self.total_amount = self.quantity * self.unit_price
        return self.total_amount


class MaterialList(models.Model):
    """材料清单（与项目关联）"""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='material_lists', verbose_name='项目')
    name = models.CharField('清单名称', max_length=200)
    description = models.TextField('说明', blank=True)
    total_amount = models.DecimalField('总金额', max_digits=14, decimal_places=2, default=0)
    is_approved = models.BooleanField('已确认', default=False)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='approved_material_lists', verbose_name='确认人', null=True, blank=True
    )
    approved_at = models.DateTimeField('确认时间', null=True, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='created_material_lists', verbose_name='创建人', null=True, blank=True
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '材料清单'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.project.code} - {self.name}'

    def calculate_total(self):
        self.total_amount = sum(item.total_amount for item in self.items.all())
        return self.total_amount


class MaterialListItem(models.Model):
    """材料清单项"""
    material_list = models.ForeignKey(MaterialList, on_delete=models.CASCADE, related_name='items', verbose_name='材料清单')
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='list_items', verbose_name='材料', null=True, blank=True)
    material_name = models.CharField('材料名称', max_length=200)
    specification = models.CharField('规格型号', max_length=200, blank=True)
    unit = models.CharField('单位', max_length=20)
    quantity = models.DecimalField('数量', max_digits=12, decimal_places=2, default=0)
    unit_price = models.DecimalField('单价', max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField('金额', max_digits=14, decimal_places=2, default=0)
    remark = models.TextField('备注', blank=True)
    sort_order = models.IntegerField('排序', default=0)

    class Meta:
        verbose_name = '材料清单项'
        verbose_name_plural = verbose_name
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f'{self.material_name} x {self.quantity}'

    def calculate_total(self):
        self.total_amount = self.quantity * self.unit_price
        return self.total_amount
