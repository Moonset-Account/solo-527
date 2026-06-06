from django.db import models
from django.utils import timezone


class Notification(models.Model):
    INFO = 'info'
    WARNING = 'warning'
    ERROR = 'error'
    SUCCESS = 'success'

    TYPE_CHOICES = [
        (INFO, '信息'),
        (WARNING, '警告'),
        (ERROR, '错误'),
        (SUCCESS, '成功'),
    ]

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='notifications', verbose_name='接收人')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=INFO, verbose_name='类型')
    title = models.CharField(max_length=200, verbose_name='标题')
    message = models.TextField(verbose_name='消息内容')
    is_read = models.BooleanField(default=False, verbose_name='是否已读')
    related_exhibition = models.ForeignKey('exhibitions.Exhibition', on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications', verbose_name='关联展览')
    related_borrow_order = models.ForeignKey('exhibitions.BorrowOrder', on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications', verbose_name='关联借用单')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    read_at = models.DateTimeField(null=True, blank=True, verbose_name='阅读时间')

    class Meta:
        verbose_name = '通知'
        verbose_name_plural = '通知'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} - {self.title}'

    def get_type_display_name(self):
        return dict(self.TYPE_CHOICES).get(self.type, self.type)

    def mark_as_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()


class ScheduleConflict(models.Model):
    MATERIAL_CONFLICT = 'material'
    HALL_CONFLICT = 'hall'
    TIME_OVERLAP = 'time_overlap'

    TYPE_CHOICES = [
        (MATERIAL_CONFLICT, '物料冲突'),
        (HALL_CONFLICT, '展厅冲突'),
        (TIME_OVERLAP, '时间重叠'),
    ]

    LOW = 'low'
    MEDIUM = 'medium'
    HIGH = 'high'
    CRITICAL = 'critical'

    SEVERITY_CHOICES = [
        (LOW, '低'),
        (MEDIUM, '中'),
        (HIGH, '高'),
        (CRITICAL, '严重'),
    ]

    type = models.CharField(max_length=50, choices=TYPE_CHOICES, verbose_name='冲突类型')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default=MEDIUM, verbose_name='严重程度')
    exhibition = models.ForeignKey('exhibitions.Exhibition', on_delete=models.CASCADE, related_name='conflicts', verbose_name='展览')
    conflicting_exhibition = models.ForeignKey('exhibitions.Exhibition', on_delete=models.SET_NULL, null=True, blank=True, related_name='conflicting_exhibitions', verbose_name='冲突展览')
    borrow_order = models.ForeignKey('exhibitions.BorrowOrder', on_delete=models.SET_NULL, null=True, blank=True, related_name='conflicts', verbose_name='借用单')
    conflicting_borrow_order = models.ForeignKey('exhibitions.BorrowOrder', on_delete=models.SET_NULL, null=True, blank=True, related_name='conflicting_orders', verbose_name='冲突借用单')
    material = models.ForeignKey('inventory.Material', on_delete=models.SET_NULL, null=True, blank=True, related_name='conflicts', verbose_name='冲突物料')
    conflict_date = models.DateField(verbose_name='冲突日期')
    description = models.TextField(verbose_name='冲突描述')
    is_resolved = models.BooleanField(default=False, verbose_name='是否已解决')
    resolved_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_conflicts', verbose_name='解决人')
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name='解决时间')
    resolution_notes = models.TextField(blank=True, verbose_name='解决备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '日程冲突'
        verbose_name_plural = '日程冲突'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_type_display()} - {self.conflict_date}'

    def get_type_display_name(self):
        return dict(self.TYPE_CHOICES).get(self.type, self.type)

    def get_severity_display_name(self):
        return dict(self.SEVERITY_CHOICES).get(self.severity, self.severity)


class DailySchedule(models.Model):
    date = models.DateField(unique=True, verbose_name='日期')
    notes = models.TextField(blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '每日日程'
        verbose_name_plural = '每日日程'
        ordering = ['-date']

    def __str__(self):
        return str(self.date)

    def get_conflicts(self):
        return ScheduleConflict.objects.filter(conflict_date=self.date, is_resolved=False)

    def get_borrow_orders(self):
        from exhibitions.models import BorrowOrder
        return BorrowOrder.objects.filter(
            models.Q(expected_pickup_date=self.date) |
            models.Q(expected_return_date=self.date)
        ).distinct()

    def get_unreturned_items(self):
        from exhibitions.models import BorrowItem
        return BorrowItem.objects.filter(
            status__in=['picked_up', 'pending'],
            borrow_order__expected_return_date__lt=self.date
        ).select_related('borrow_order', 'material')

    def get_in_transit_records(self):
        from exhibitions.models import TransportRecord
        return TransportRecord.objects.filter(
            status='in_transit'
        ).select_related('borrow_order')
