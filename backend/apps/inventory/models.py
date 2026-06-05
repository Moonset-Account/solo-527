from django.db import models
from apps.core.models import BaseModel
from apps.books.models import Book, Supplier


class StockIn(BaseModel):
    STATUS_DRAFT = 'draft'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_CANCELLED = 'cancelled'
    
    STATUS_CHOICES = [
        (STATUS_DRAFT, '草稿'),
        (STATUS_CONFIRMED, '已确认'),
        (STATUS_CANCELLED, '已取消'),
    ]
    
    in_no = models.CharField(max_length=30, unique=True, verbose_name='入库单号')
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, related_name='stock_ins', verbose_name='供应商')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT, verbose_name='状态')
    total_quantity = models.IntegerField(default=0, verbose_name='总数量')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='总金额')
    in_date = models.DateTimeField(null=True, blank=True, verbose_name='入库时间')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        db_table = 'stock_in'
        verbose_name = '入库单'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.in_no


class StockInItem(models.Model):
    stock_in = models.ForeignKey(StockIn, on_delete=models.CASCADE, related_name='items', verbose_name='入库单')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='stock_in_items', verbose_name='图书')
    quantity = models.IntegerField(verbose_name='数量')
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='进货价')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='小计')
    batch_no = models.CharField(max_length=50, blank=True, verbose_name='批次号')
    expire_date = models.DateField(null=True, blank=True, verbose_name='有效期')

    class Meta:
        db_table = 'stock_in_item'
        verbose_name = '入库明细'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.stock_in.in_no} - {self.book.title}'


class StockOut(BaseModel):
    STATUS_DRAFT = 'draft'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_CANCELLED = 'cancelled'
    
    STATUS_CHOICES = [
        (STATUS_DRAFT, '草稿'),
        (STATUS_CONFIRMED, '已确认'),
        (STATUS_CANCELLED, '已取消'),
    ]
    
    TYPE_SALE = 'sale'
    TYPE_DAMAGE = 'damage'
    TYPE_LOST = 'lost'
    TYPE_OTHER = 'other'
    
    TYPE_CHOICES = [
        (TYPE_SALE, '销售出库'),
        (TYPE_DAMAGE, '损坏出库'),
        (TYPE_LOST, '丢失出库'),
        (TYPE_OTHER, '其他出库'),
    ]
    
    out_no = models.CharField(max_length=30, unique=True, verbose_name='出库单号')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_SALE, verbose_name='出库类型')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT, verbose_name='状态')
    total_quantity = models.IntegerField(default=0, verbose_name='总数量')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='总金额')
    out_date = models.DateTimeField(null=True, blank=True, verbose_name='出库时间')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        db_table = 'stock_out'
        verbose_name = '出库单'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.out_no


class StockOutItem(models.Model):
    stock_out = models.ForeignKey(StockOut, on_delete=models.CASCADE, related_name='items', verbose_name='出库单')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='stock_out_items', verbose_name='图书')
    quantity = models.IntegerField(verbose_name='数量')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='单价')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='小计')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        db_table = 'stock_out_item'
        verbose_name = '出库明细'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.stock_out.out_no} - {self.book.title}'


class StockCheck(BaseModel):
    STATUS_DRAFT = 'draft'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_CANCELLED = 'cancelled'
    
    STATUS_CHOICES = [
        (STATUS_DRAFT, '草稿'),
        (STATUS_CONFIRMED, '已确认'),
        (STATUS_CANCELLED, '已取消'),
    ]
    
    check_no = models.CharField(max_length=30, unique=True, verbose_name='盘点单号')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT, verbose_name='状态')
    check_date = models.DateTimeField(null=True, blank=True, verbose_name='盘点时间')
    total_diff_quantity = models.IntegerField(default=0, verbose_name='差异总数')
    total_diff_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='差异总金额')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        db_table = 'stock_check'
        verbose_name = '盘点单'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.check_no


class StockCheckItem(models.Model):
    stock_check = models.ForeignKey(StockCheck, on_delete=models.CASCADE, related_name='items', verbose_name='盘点单')
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='check_items', verbose_name='图书')
    system_quantity = models.IntegerField(verbose_name='系统库存')
    actual_quantity = models.IntegerField(verbose_name='实际库存')
    diff_quantity = models.IntegerField(verbose_name='差异数量')
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='成本价')
    diff_amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='差异金额')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        db_table = 'stock_check_item'
        verbose_name = '盘点明细'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.stock_check.check_no} - {self.book.title}'


class StockLog(models.Model):
    TYPE_IN = 'in'
    TYPE_OUT = 'out'
    TYPE_CHECK = 'check'
    TYPE_ADJUST = 'adjust'
    
    TYPE_CHOICES = [
        (TYPE_IN, '入库'),
        (TYPE_OUT, '出库'),
        (TYPE_CHECK, '盘点调整'),
        (TYPE_ADJUST, '手工调整'),
    ]
    
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='stock_logs', verbose_name='图书')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='类型')
    quantity_before = models.IntegerField(verbose_name='变动前数量')
    quantity_change = models.IntegerField(verbose_name='变动数量')
    quantity_after = models.IntegerField(verbose_name='变动后数量')
    related_type = models.CharField(max_length=50, blank=True, verbose_name='关联单据类型')
    related_id = models.IntegerField(null=True, blank=True, verbose_name='关联单据ID')
    remark = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    created_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_logs',
        verbose_name='操作人'
    )

    class Meta:
        db_table = 'stock_log'
        verbose_name = '库存日志'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.book.title} - {self.get_type_display()}: {self.quantity_change}'
