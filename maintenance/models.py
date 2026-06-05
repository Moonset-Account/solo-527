from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel, User
from equipment.models import Equipment
from auditlog.registry import auditlog


class FaultTicket(BaseModel):
    class Priority(models.TextChoices):
        LOW = 'low', _('低')
        MEDIUM = 'medium', _('中')
        HIGH = 'high', _('高')
        CRITICAL = 'critical', _('紧急')

    class Status(models.TextChoices):
        OPEN = 'open', _('待处理')
        IN_PROGRESS = 'in_progress', _('处理中')
        WAITING_PARTS = 'waiting_parts', _('等待配件')
        RESOLVED = 'resolved', _('已解决')
        CLOSED = 'closed', _('已关闭')

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name='fault_tickets',
        verbose_name=_('设备')
    )
    reporter = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='reported_faults',
        verbose_name=_('上报人')
    )
    assignee = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='assigned_faults',
        null=True,
        blank=True,
        limit_choices_to={'role__in': ['technician', 'admin']},
        verbose_name=_('处理人')
    )
    title = models.CharField(_('故障标题'), max_length=200)
    description = models.TextField(_('故障描述'))
    priority = models.CharField(_('优先级'), max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(_('状态'), max_length=20, choices=Status.choices, default=Status.OPEN)
    fault_type = models.CharField(_('故障类型'), max_length=100, blank=True)
    resolution = models.TextField(_('解决方案'), blank=True)
    resolved_at = models.DateTimeField(_('解决时间'), null=True, blank=True)
    resolved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='resolved_faults',
        null=True,
        blank=True,
        verbose_name=_('解决人')
    )
    estimated_cost = models.DecimalField(_('预估费用'), max_digits=10, decimal_places=2, null=True, blank=True)
    actual_cost = models.DecimalField(_('实际费用'), max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        verbose_name = _('故障单')
        verbose_name_plural = _('故障单')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['equipment', 'status']),
            models.Index(fields=['reporter', 'status']),
            models.Index(fields=['assignee', 'status']),
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'[{self.get_priority_display()}] {self.title} - {self.equipment.name}'


class FaultAttachment(models.Model):
    ticket = models.ForeignKey(
        FaultTicket,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name=_('故障单')
    )
    file = models.FileField(_('附件'), upload_to='fault_attachments/')
    file_name = models.CharField(_('文件名'), max_length=255)
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('上传人')
    )
    uploaded_at = models.DateTimeField(_('上传时间'), auto_now_add=True)

    class Meta:
        verbose_name = _('故障附件')
        verbose_name_plural = _('故障附件')

    def __str__(self):
        return self.file_name


class FaultComment(BaseModel):
    ticket = models.ForeignKey(
        FaultTicket,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name=_('故障单')
    )
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='fault_comments',
        verbose_name=_('评论人')
    )
    content = models.TextField(_('评论内容'))
    is_internal = models.BooleanField(_('内部评论'), default=False)

    class Meta:
        verbose_name = _('故障评论')
        verbose_name_plural = _('故障评论')
        ordering = ['created_at']

    def __str__(self):
        return f'{self.user.real_name} - {self.ticket.title}'


class MaintenanceSchedule(BaseModel):
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name='maintenance_schedules',
        verbose_name=_('设备')
    )
    title = models.CharField(_('维护标题'), max_length=200)
    description = models.TextField(_('维护描述'), blank=True)
    scheduled_date = models.DateField(_('计划日期'))
    performed_date = models.DateField(_('实际日期'), null=True, blank=True)
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='performed_maintenance',
        null=True,
        blank=True,
        verbose_name=_('执行人')
    )
    is_completed = models.BooleanField(_('已完成'), default=False)
    notes = models.TextField(_('备注'), blank=True)

    class Meta:
        verbose_name = _('维护计划')
        verbose_name_plural = _('维护计划')
        ordering = ['scheduled_date']
        indexes = [
            models.Index(fields=['equipment', 'is_completed']),
            models.Index(fields=['scheduled_date']),
        ]

    def __str__(self):
        return f'{self.equipment.name} - {self.title}'


auditlog.register(FaultTicket)
auditlog.register(MaintenanceSchedule)
