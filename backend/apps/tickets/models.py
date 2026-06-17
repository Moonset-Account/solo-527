from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from apps.core.models import BaseModel
import hashlib


class Ticket(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'pending', _('待处理')
        PROCESSING = 'processing', _('处理中')
        ESCALATED = 'escalated', _('已升级')
        RESOLVED = 'resolved', _('已解决')
        CLOSED = 'closed', _('已关闭')

    class Priority(models.TextChoices):
        LOW = 'low', _('低')
        MEDIUM = 'medium', _('中')
        HIGH = 'high', _('高')
        URGENT = 'urgent', _('紧急')

    class Type(models.TextChoices):
        REFUND = 'refund', _('退款')
        EXCHANGE = 'exchange', _('换货')
        COMPLAINT = 'complaint', _('投诉')
        CONSULT = 'consult', _('咨询')
        OTHER = 'other', _('其他')

    ticket_no = models.CharField(max_length=32, unique=True, verbose_name='工单编号')
    title = models.CharField(max_length=200, verbose_name='标题')
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
    type = models.CharField(
        max_length=20,
        choices=Type.choices,
        default=Type.CONSULT,
        verbose_name='工单类型'
    )
    order_no = models.CharField(max_length=50, blank=True, verbose_name='订单号')
    product_name = models.CharField(max_length=200, blank=True, verbose_name='商品名称')
    customer_name = models.CharField(max_length=100, verbose_name='客户姓名')
    customer_phone = models.CharField(max_length=20, verbose_name='客户电话')
    customer_email = models.EmailField(blank=True, verbose_name='客户邮箱')
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
        verbose_name='处理人'
    )
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_tickets',
        verbose_name='创建人'
    )
    escalated_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='escalated_tickets',
        verbose_name='升级对象'
    )
    escalated_at = models.DateTimeField(null=True, blank=True, verbose_name='升级时间')
    escalation_reason = models.TextField(null=True, blank=True, verbose_name='升级原因')
    first_response_at = models.DateTimeField(null=True, blank=True, verbose_name='首次响应时间')
    resolution = models.TextField(null=True, blank=True, verbose_name='处理结果')
    sla_deadline = models.DateTimeField(verbose_name='SLA截止时间')
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name='解决时间')
    closed_at = models.DateTimeField(null=True, blank=True, verbose_name='关闭时间')
    satisfaction_score = models.IntegerField(null=True, blank=True, verbose_name='满意度评分')
    tags = models.JSONField(default=list, blank=True, verbose_name='标签')

    class Meta:
        verbose_name = '工单'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['ticket_no']),
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['type']),
            models.Index(fields=['assignee']),
            models.Index(fields=['creator']),
            models.Index(fields=['created_at']),
            models.Index(fields=['sla_deadline']),
        ]

    def __str__(self):
        return f'{self.ticket_no} {self.title}'

    @property
    def is_overdue(self):
        if self.sla_deadline and self.status in [self.Status.PENDING, self.Status.PROCESSING, self.Status.ESCALATED]:
            return timezone.now() > self.sla_deadline
        return False

    @property
    def first_response_duration(self):
        if self.first_response_at and self.created_at:
            return (self.first_response_at - self.created_at).total_seconds()
        return None

    @property
    def total_duration(self):
        end_time = self.closed_at or self.resolved_at or timezone.now()
        if self.created_at:
            return (end_time - self.created_at).total_seconds()
        return None

    def save(self, *args, **kwargs):
        if not self.ticket_no:
            self.ticket_no = self._generate_ticket_no()
        super().save(*args, **kwargs)

    def _generate_ticket_no(self):
        timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
        last_ticket = Ticket.objects.order_by('-id').first()
        seq = (last_ticket.id + 1) if last_ticket else 1
        return f'TK{timestamp}{seq:04d}'


class TicketNote(BaseModel):
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='notes',
        verbose_name='工单'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        related_name='ticket_notes',
        verbose_name='备注人'
    )
    content = models.TextField(verbose_name='内容')
    is_internal = models.BooleanField(default=False, verbose_name='是否内部备注')
    attachment = models.FileField(upload_to='ticket_notes/', null=True, blank=True, verbose_name='附件')

    class Meta:
        verbose_name = '工单备注'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['ticket']),
            models.Index(fields=['is_internal']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.ticket} - {self.content[:30]}'


class TicketHistory(BaseModel):
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='history',
        verbose_name='工单'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='ticket_actions',
        verbose_name='操作人'
    )
    action = models.CharField(max_length=100, verbose_name='操作')
    description = models.TextField(blank=True, verbose_name='操作描述')
    old_value = models.TextField(blank=True, verbose_name='旧值')
    new_value = models.TextField(blank=True, verbose_name='新值')
    field_name = models.CharField(max_length=50, blank=True, verbose_name='字段名')

    class Meta:
        verbose_name = '工单历史'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['ticket']),
            models.Index(fields=['actor']),
            models.Index(fields=['action']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.ticket} - {self.action}'
