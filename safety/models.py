from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel, User
from equipment.models import Equipment
from auditlog.registry import auditlog


class SafetyIncident(BaseModel):
    class Severity(models.TextChoices):
        MINOR = 'minor', _('轻微')
        MODERATE = 'moderate', _('一般')
        SERIOUS = 'serious', _('严重')
        CRITICAL = 'critical', _('重大')

    class Status(models.TextChoices):
        REPORTED = 'reported', _('已上报')
        INVESTIGATING = 'investigating', _('调查中')
        RESOLVED = 'resolved', _('已处理')
        CLOSED = 'closed', _('已归档')

    reporter = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='reported_incidents',
        verbose_name=_('上报人')
    )
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.SET_NULL,
        related_name='safety_incidents',
        null=True,
        blank=True,
        verbose_name=_('关联设备')
    )
    title = models.CharField(_('事件标题'), max_length=200)
    description = models.TextField(_('事件描述'))
    incident_time = models.DateTimeField(_('发生时间'))
    location = models.CharField(_('发生地点'), max_length=200)
    severity = models.CharField(_('严重程度'), max_length=20, choices=Severity.choices, default=Severity.MODERATE)
    status = models.CharField(_('状态'), max_length=20, choices=Status.choices, default=Status.REPORTED)
    involved_people = models.TextField(_('涉事人员'), blank=True)
    injuries = models.TextField(_('人员伤亡情况'), blank=True)
    immediate_actions = models.TextField(_('即时处理措施'), blank=True)
    root_cause = models.TextField(_('根本原因分析'), blank=True)
    corrective_actions = models.TextField(_('纠正措施'), blank=True)
    preventive_measures = models.TextField(_('预防措施'), blank=True)
    investigated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='investigated_incidents',
        null=True,
        blank=True,
        verbose_name=_('调查人')
    )
    resolved_at = models.DateTimeField(_('处理时间'), null=True, blank=True)
    closed_at = models.DateTimeField(_('归档时间'), null=True, blank=True)

    class Meta:
        verbose_name = _('安全事件')
        verbose_name_plural = _('安全事件')
        ordering = ['-incident_time']
        indexes = [
            models.Index(fields=['severity', 'status']),
            models.Index(fields=['equipment', 'incident_time']),
            models.Index(fields=['reporter', 'created_at']),
            models.Index(fields=['incident_time']),
        ]

    def __str__(self):
        return f'[{self.get_severity_display()}] {self.title}'


class SafetyAttachment(models.Model):
    incident = models.ForeignKey(
        SafetyIncident,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name=_('安全事件')
    )
    file = models.FileField(_('附件'), upload_to='safety_attachments/')
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
        verbose_name = _('安全附件')
        verbose_name_plural = _('安全附件')

    def __str__(self):
        return self.file_name


class SafetyInspection(BaseModel):
    class Status(models.TextChoices):
        SCHEDULED = 'scheduled', _('计划中')
        IN_PROGRESS = 'in_progress', _('进行中')
        COMPLETED = 'completed', _('已完成')
        CANCELLED = 'cancelled', _('已取消')

    title = models.CharField(_('检查标题'), max_length=200)
    description = models.TextField(_('检查描述'), blank=True)
    scheduled_date = models.DateField(_('计划日期'))
    performed_date = models.DateField(_('执行日期'), null=True, blank=True)
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='performed_inspections',
        null=True,
        blank=True,
        verbose_name=_('执行人')
    )
    status = models.CharField(_('状态'), max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    findings = models.TextField(_('检查发现'), blank=True)
    recommendations = models.TextField(_('建议'), blank=True)
    follow_up_date = models.DateField(_('跟进日期'), null=True, blank=True)

    class Meta:
        verbose_name = _('安全检查')
        verbose_name_plural = _('安全检查')
        ordering = ['-scheduled_date']
        indexes = [
            models.Index(fields=['status', 'scheduled_date']),
        ]

    def __str__(self):
        return f'{self.title} - {self.scheduled_date}'


class SafetyTrainingRecord(BaseModel):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='safety_training_records',
        verbose_name=_('参训人')
    )
    title = models.CharField(_('培训标题'), max_length=200)
    description = models.TextField(_('培训内容'), blank=True)
    training_date = models.DateField(_('培训日期'))
    trainer = models.CharField(_('培训师'), max_length=100)
    duration_hours = models.DecimalField(_('时长(小时)'), max_digits=4, decimal_places=1, default=1.0)
    passed = models.BooleanField(_('是否通过'), default=True)
    certificate_number = models.CharField(_('证书编号'), max_length=50, blank=True)
    expiry_date = models.DateField(_('有效期至'), null=True, blank=True)
    notes = models.TextField(_('备注'), blank=True)

    class Meta:
        verbose_name = _('安全培训记录')
        verbose_name_plural = _('安全培训记录')
        ordering = ['-training_date']
        indexes = [
            models.Index(fields=['user', 'training_date']),
        ]

    def __str__(self):
        return f'{self.user.real_name} - {self.title}'


auditlog.register(SafetyIncident)
auditlog.register(SafetyInspection)
auditlog.register(SafetyTrainingRecord)
