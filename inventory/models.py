from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import date


class SupplyCategory(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name='分类名称')
    description = models.TextField(blank=True, verbose_name='描述')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '耗材分类'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name


class Supply(models.Model):
    SUPPLY_TYPE_CHOICES = [
        ('NORMAL', '普通耗材'),
        ('HIGH_VALUE', '高值耗材'),
        ('DEVICE', '器械包'),
    ]

    name = models.CharField(max_length=200, verbose_name='耗材名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='耗材编码')
    category = models.ForeignKey(SupplyCategory, on_delete=models.PROTECT, verbose_name='分类')
    supply_type = models.CharField(max_length=20, choices=SUPPLY_TYPE_CHOICES, default='NORMAL', verbose_name='耗材类型')
    specification = models.CharField(max_length=200, blank=True, verbose_name='规格型号')
    unit = models.CharField(max_length=20, default='个', verbose_name='单位')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='单价')
    warning_threshold = models.IntegerField(default=10, verbose_name='库存预警阈值')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '耗材信息'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.name} ({self.code})'

    @property
    def total_stock(self):
        return self.batch_set.filter(is_expired=False).aggregate(total=models.Sum('quantity'))['total'] or 0


class Batch(models.Model):
    supply = models.ForeignKey(Supply, on_delete=models.CASCADE, verbose_name='耗材')
    batch_number = models.CharField(max_length=100, verbose_name='批号')
    production_date = models.DateField(verbose_name='生产日期')
    expiry_date = models.DateField(verbose_name='有效期至')
    quantity = models.IntegerField(verbose_name='数量')
    storage_location = models.CharField(max_length=100, verbose_name='存放位置')
    is_expired = models.BooleanField(default=False, verbose_name='是否过期')
    supplier = models.CharField(max_length=200, blank=True, verbose_name='供应商')
    received_at = models.DateTimeField(auto_now_add=True, verbose_name='入库时间')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '批号库存'
        verbose_name_plural = verbose_name
        unique_together = ('supply', 'batch_number')

    def __str__(self):
        return f'{self.supply.name} - {self.batch_number}'

    def clean(self):
        if self.expiry_date <= self.production_date:
            raise ValidationError('有效期必须晚于生产日期')
        if self.quantity < 0:
            raise ValidationError('数量不能为负数')

    def check_expired(self):
        today = date.today()
        if self.expiry_date < today and not self.is_expired:
            self.is_expired = True
            self.save()
        return self.is_expired

    @property
    def days_to_expire(self):
        today = date.today()
        delta = self.expiry_date - today
        return delta.days

    @property
    def is_warning(self):
        return 0 <= self.days_to_expire <= 30


class ScanRecord(models.Model):
    SCAN_TYPE_CHOICES = [
        ('IN', '入库扫描'),
        ('OUT', '领用扫描'),
        ('RETURN', '退包扫描'),
        ('INVENTORY', '盘点扫描'),
    ]

    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, verbose_name='批号')
    scan_type = models.CharField(max_length=20, choices=SCAN_TYPE_CHOICES, verbose_name='扫描类型')
    quantity = models.IntegerField(verbose_name='数量')
    operator = models.ForeignKey(User, on_delete=models.PROTECT, related_name='scan_records', verbose_name='操作人')
    confirm_operator = models.ForeignKey(User, on_delete=models.PROTECT, related_name='confirmed_scans', null=True, blank=True, verbose_name='确认人')
    is_double_confirmed = models.BooleanField(default=False, verbose_name='是否双人确认')
    scan_time = models.DateTimeField(auto_now_add=True, verbose_name='扫描时间')
    confirm_time = models.DateTimeField(null=True, blank=True, verbose_name='确认时间')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        verbose_name = '扫码记录'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.get_scan_type_display()} - {self.batch} - {self.quantity}'

    def confirm(self, user):
        if self.is_double_confirmed:
            raise ValidationError('已完成双人确认，无需重复确认')
        if user.id == self.operator_id:
            raise ValidationError('确认人不能与操作人相同')
        self.confirm_operator = user
        self.is_double_confirmed = True
        self.confirm_time = timezone.now()
        self.save()


class StockWarning(models.Model):
    WARNING_TYPE_CHOICES = [
        ('LOW_STOCK', '库存不足'),
        ('EXPIRING', '即将过期'),
        ('EXPIRED', '已过期'),
    ]

    WARNING_LEVEL_CHOICES = [
        ('INFO', '提示'),
        ('WARNING', '警告'),
        ('DANGER', '危险'),
    ]

    supply = models.ForeignKey(Supply, on_delete=models.CASCADE, verbose_name='耗材')
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, null=True, blank=True, verbose_name='批号')
    warning_type = models.CharField(max_length=20, choices=WARNING_TYPE_CHOICES, verbose_name='预警类型')
    warning_level = models.CharField(max_length=20, choices=WARNING_LEVEL_CHOICES, default='WARNING', verbose_name='预警级别')
    message = models.TextField(verbose_name='预警信息')
    is_handled = models.BooleanField(default=False, verbose_name='是否已处理')
    handled_by = models.ForeignKey(User, on_delete=models.PROTECT, null=True, blank=True, verbose_name='处理人')
    handled_at = models.DateTimeField(null=True, blank=True, verbose_name='处理时间')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '库存预警'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.get_warning_type_display()} - {self.supply.name}'
