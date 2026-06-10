from django.db import models

from apps.properties.models import Room


class Inventory(models.Model):
    STATUS_CHOICES = (
        ('available', '可订'),
        ('booked', '已订'),
        ('maintenance', '维护'),
        ('closed', '关闭'),
    )

    id = models.BigAutoField(primary_key=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='inventory', verbose_name='房型')
    date = models.DateField('日期')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='available')
    price = models.DecimalField('价格', max_digits=10, decimal_places=2, default=0)
    is_locked = models.BooleanField('是否锁定', default=False)
    locked_by = models.CharField('锁定原因', max_length=100, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'inventory'
        verbose_name = '房态'
        verbose_name_plural = '房态'
        unique_together = [['room', 'date']]
        indexes = [
            models.Index(fields=['room', 'date'], name='idx_inventory_room_date'),
        ]
        ordering = ['date']

    def __str__(self):
        return f'{self.room.name} - {self.date} ({self.get_status_display()})'


class InventoryConflict(models.Model):
    CONFLICT_TYPES = (
        ('double_booking', '重复预订'),
        ('price_mismatch', '价格不一致'),
        ('status_overlap', '状态重叠'),
        ('manual_block', '手动锁定冲突'),
    )

    SEVERITY_CHOICES = (
        (1, '紧急'),
        (2, '重要'),
        (3, '一般'),
        (4, '通知'),
    )

    id = models.BigAutoField(primary_key=True)
    inventory = models.ForeignKey(
        Inventory,
        on_delete=models.CASCADE,
        related_name='conflicts',
        verbose_name='房态',
        null=True
    )
    room = models.ForeignKey(Room, on_delete=models.CASCADE, verbose_name='房型')
    date = models.DateField('日期')
    conflict_type = models.CharField('冲突类型', max_length=50, choices=CONFLICT_TYPES)
    severity = models.IntegerField('严重级别', choices=SEVERITY_CHOICES, default=1)
    description = models.TextField('冲突描述', blank=True)
    related_order_id = models.UUIDField('关联订单ID', null=True, blank=True)
    is_resolved = models.BooleanField('是否已解决', default=False)
    resolved_at = models.DateTimeField('解决时间', null=True, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        db_table = 'inventory_conflict'
        verbose_name = '房态冲突'
        verbose_name_plural = '房态冲突'
        indexes = [
            models.Index(fields=['is_resolved', 'severity'], name='idx_conflict_unresolved'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_conflict_type_display()} - {self.date}'


class SpecialPricing(models.Model):
    id = models.BigAutoField(primary_key=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='special_pricing', verbose_name='房型')
    start_date = models.DateField('开始日期')
    end_date = models.DateField('结束日期')
    price = models.DecimalField('价格', max_digits=10, decimal_places=2)
    reason = models.CharField('价格原因', max_length=100, blank=True)
    is_holiday = models.BooleanField('是否节假日', default=False)
    is_active = models.BooleanField('是否启用', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'special_pricing'
        verbose_name = '特殊价格'
        verbose_name_plural = '特殊价格'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.room.name} - {self.start_date} ~ {self.end_date}: ¥{self.price}'
