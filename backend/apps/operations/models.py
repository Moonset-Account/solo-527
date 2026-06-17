from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.core.models import BaseModel
from apps.tickets.models import Ticket
import hashlib


class QualityCheck(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'pending', _('待质检')
        CHECKING = 'checking', _('质检中')
        PASSED = 'passed', _('已通过')
        FAILED = 'failed', _('未通过')

    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='quality_checks',
        verbose_name='关联工单'
    )
    checker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='quality_checks',
        verbose_name='质检人'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='质检状态'
    )
    score = models.IntegerField(null=True, blank=True, verbose_name='质检分数')
    check_items = models.JSONField(default=dict, verbose_name='检查项')
    comments = models.TextField(blank=True, verbose_name='质检评语')
    issues_found = models.TextField(blank=True, verbose_name='发现问题')
    suggestions = models.TextField(blank=True, verbose_name='改进建议')
    checked_at = models.DateTimeField(null=True, blank=True, verbose_name='质检时间')
    remarks = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        verbose_name = '质检记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['ticket']),
            models.Index(fields=['checker']),
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'质检-{self.ticket.ticket_no}'


class ImprovementAction(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'pending', _('待执行')
        IN_PROGRESS = 'in_progress', _('进行中')
        COMPLETED = 'completed', _('已完成')
        CANCELLED = 'cancelled', _('已取消')

    class Priority(models.TextChoices):
        LOW = 'low', _('低')
        MEDIUM = 'medium', _('中')
        HIGH = 'high', _('高')

    title = models.CharField(max_length=200, verbose_name='改进项标题')
    description = models.TextField(verbose_name='问题描述')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='状态'
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
        verbose_name='优先级'
    )
    quality_check = models.ForeignKey(
        QualityCheck,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='improvement_actions',
        verbose_name='关联质检'
    )
    related_ticket = models.ForeignKey(
        Ticket,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='improvement_actions',
        verbose_name='关联工单'
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='assigned_improvements',
        verbose_name='负责人'
    )
    due_date = models.DateField(verbose_name='截止日期')
    progress = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='进度百分比'
    )
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')
    solution = models.TextField(blank=True, verbose_name='解决方案')
    result = models.TextField(blank=True, verbose_name='执行结果')
    tags = models.JSONField(default=list, blank=True, verbose_name='标签')

    class Meta:
        verbose_name = '改进措施'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['assignee']),
            models.Index(fields=['due_date']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.status == self.Status.COMPLETED and not self.completed_at:
            self.completed_at = timezone.now()
        super().save(*args, **kwargs)


class ExportRecord(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'pending', _('待处理')
        PROCESSING = 'processing', _('处理中')
        COMPLETED = 'completed', _('已完成')
        FAILED = 'failed', _('失败')

    class ExportType(models.TextChoices):
        TICKETS = 'tickets', _('工单数据')
        QUALITY = 'quality', _('质检数据')
        KNOWLEDGE = 'knowledge', _('知识库数据')
        REPORTS = 'reports', _('报表数据')
        CUSTOM = 'custom', _('自定义导出')

    export_type = models.CharField(
        max_length=20,
        choices=ExportType.choices,
        default=ExportType.TICKETS,
        verbose_name='导出类型'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='状态'
    )
    file_name = models.CharField(max_length=200, verbose_name='文件名')
    file_path = models.FileField(upload_to='exports/', null=True, blank=True, verbose_name='文件路径')
    file_size = models.IntegerField(null=True, blank=True, verbose_name='文件大小(字节)')
    filters = models.JSONField(default=dict, verbose_name='筛选条件')
    filter_hash = models.CharField(max_length=64, verbose_name='筛选条件哈希值')
    record_count = models.IntegerField(null=True, blank=True, verbose_name='记录数')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='exports',
        verbose_name='创建人'
    )
    previous_export = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='next_exports',
        verbose_name='上一次相同条件导出'
    )
    started_at = models.DateTimeField(null=True, blank=True, verbose_name='开始时间')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')
    error_message = models.TextField(blank=True, verbose_name='错误信息')
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name='过期时间')

    class Meta:
        verbose_name = '导出记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['export_type']),
            models.Index(fields=['status']),
            models.Index(fields=['filter_hash']),
            models.Index(fields=['created_by']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.get_export_type_display()}-{self.file_name}'

    def save(self, *args, **kwargs):
        if not self.filter_hash:
            self.filter_hash = self.calculate_filter_hash()
        if not self.previous_export:
            self.previous_export = self.find_previous_export()
        super().save(*args, **kwargs)

    @staticmethod
    def calculate_filter_hash_from_filters(filters, export_type):
        filter_str = f"{export_type}:{str(sorted(filters.items()))}"
        return hashlib.sha256(filter_str.encode('utf-8')).hexdigest()

    def calculate_filter_hash(self):
        return self.calculate_filter_hash_from_filters(self.filters, self.export_type)

    def find_previous_export(self):
        return ExportRecord.objects.filter(
            filter_hash=self.filter_hash,
            status=ExportRecord.Status.COMPLETED
        ).exclude(id=self.id).order_by('-created_at').first()
