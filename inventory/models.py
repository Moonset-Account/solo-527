from django.db import models
from django.utils import timezone


class MaterialCategory(models.Model):
    name = models.CharField(max_length=100, verbose_name='类别名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='类别编码')
    description = models.TextField(blank=True, verbose_name='描述')
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children', verbose_name='父类别')

    class Meta:
        verbose_name = '物料类别'
        verbose_name_plural = '物料类别'
        ordering = ['code']

    def __str__(self):
        return self.name


class Material(models.Model):
    DISPLAY_CASE = 'display_case'
    LIGHTING = 'lighting'
    TRANSPORT_BOX = 'transport_box'
    OTHER = 'other'

    TYPE_CHOICES = [
        (DISPLAY_CASE, '展柜'),
        (LIGHTING, '灯具'),
        (TRANSPORT_BOX, '运输箱'),
        (OTHER, '其他'),
    ]

    name = models.CharField(max_length=200, verbose_name='物料名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='物料编码')
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, verbose_name='物料类型')
    category = models.ForeignKey(MaterialCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='materials', verbose_name='物料类别')
    specification = models.CharField(max_length=200, blank=True, verbose_name='规格型号')
    is_valuable = models.BooleanField(default=False, verbose_name='是否贵重展具')
    requires_double_confirm = models.BooleanField(default=False, verbose_name='需要双人确认')
    description = models.TextField(blank=True, verbose_name='描述')
    image = models.ImageField(upload_to='materials/', blank=True, null=True, verbose_name='图片')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '物料'
        verbose_name_plural = '物料'
        ordering = ['code']

    def __str__(self):
        return f'{self.code} - {self.name}'

    def get_type_display_name(self):
        return dict(self.TYPE_CHOICES).get(self.type, self.type)

    def available_quantity(self):
        total = self.inventory_items.filter(status=InventoryItem.AVAILABLE).count()
        reserved = self.inventory_items.filter(status=InventoryItem.RESERVED).count()
        return total - reserved


class Warehouse(models.Model):
    name = models.CharField(max_length=100, verbose_name='仓库名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='仓库编码')
    location = models.CharField(max_length=200, blank=True, verbose_name='位置')
    manager = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_warehouses', verbose_name='仓库管理员')

    class Meta:
        verbose_name = '仓库'
        verbose_name_plural = '仓库'
        ordering = ['code']

    def __str__(self):
        return self.name


class InventoryItem(models.Model):
    AVAILABLE = 'available'
    RESERVED = 'reserved'
    BORROWED = 'borrowed'
    IN_TRANSIT = 'in_transit'
    MAINTENANCE = 'maintenance'
    DAMAGED = 'damaged'
    LOST = 'lost'

    STATUS_CHOICES = [
        (AVAILABLE, '可用'),
        (RESERVED, '已预占'),
        (BORROWED, '已借出'),
        (IN_TRANSIT, '运输中'),
        (MAINTENANCE, '维护中'),
        (DAMAGED, '损坏'),
        (LOST, '丢失'),
    ]

    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='inventory_items', verbose_name='物料')
    serial_number = models.CharField(max_length=100, unique=True, verbose_name='序列号')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_items', verbose_name='所在仓库')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default=AVAILABLE, verbose_name='状态')
    location_detail = models.CharField(max_length=200, blank=True, verbose_name='具体位置')
    purchase_date = models.DateField(null=True, blank=True, verbose_name='采购日期')
    last_inspection_date = models.DateField(null=True, blank=True, verbose_name='上次检查日期')
    remarks = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '库存明细'
        verbose_name_plural = '库存明细'
        ordering = ['material__code', 'serial_number']

    def __str__(self):
        return f'{self.material.code} - {self.serial_number}'

    def get_status_display_name(self):
        return dict(self.STATUS_CHOICES).get(self.status, self.status)

    def is_available(self):
        return self.status == self.AVAILABLE


class InventoryReservation(models.Model):
    PENDING = 'pending'
    CONFIRMED = 'confirmed'
    CANCELLED = 'cancelled'
    FULFILLED = 'fulfilled'

    STATUS_CHOICES = [
        (PENDING, '待确认'),
        (CONFIRMED, '已确认'),
        (CANCELLED, '已取消'),
        (FULFILLED, '已完成'),
    ]

    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='reservations', verbose_name='库存项')
    exhibition = models.ForeignKey('exhibitions.Exhibition', on_delete=models.CASCADE, related_name='reservations', verbose_name='展览')
    borrow_order = models.ForeignKey('exhibitions.BorrowOrder', on_delete=models.CASCADE, related_name='reservations', verbose_name='借用单', null=True, blank=True)
    requested_by = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='requested_reservations', verbose_name='申请人')
    confirmed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='confirmed_reservations', verbose_name='确认人')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default=PENDING, verbose_name='状态')
    start_date = models.DateField(verbose_name='开始日期')
    end_date = models.DateField(verbose_name='结束日期')
    remarks = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '库存预占'
        verbose_name_plural = '库存预占'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.inventory_item} - {self.exhibition.name}'

    def get_status_display_name(self):
        return dict(self.STATUS_CHOICES).get(self.status, self.status)

    def is_active(self):
        return self.status in [self.PENDING, self.CONFIRMED]
