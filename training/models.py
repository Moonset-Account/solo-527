from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel, User
from equipment.models import EquipmentCategory, Equipment
from auditlog.registry import auditlog


class TrainingCourse(BaseModel):
    class Status(models.TextChoices):
        DRAFT = 'draft', _('草稿')
        PUBLISHED = 'published', _('已发布')
        ARCHIVED = 'archived', _('已归档')

    name = models.CharField(_('课程名称'), max_length=200)
    category = models.ForeignKey(
        EquipmentCategory,
        on_delete=models.PROTECT,
        related_name='training_courses',
        verbose_name=_('适用设备类别')
    )
    description = models.TextField(_('课程描述'))
    prerequisites = models.TextField(_('前置条件'), blank=True)
    duration_hours = models.DecimalField(_('时长(小时)'), max_digits=4, decimal_places=1, default=2.0)
    max_participants = models.IntegerField(_('最大人数'), default=10)
    status = models.CharField(_('状态'), max_length=20, choices=Status.choices, default=Status.DRAFT)
    cover_image = models.ImageField(_('封面图片'), upload_to='training/', blank=True, null=True)
    materials = models.JSONField(_('参考资料'), default=list, blank=True)

    class Meta:
        verbose_name = _('培训课程')
        verbose_name_plural = _('培训课程')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['category']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return self.name


class TrainingSession(BaseModel):
    course = models.ForeignKey(
        TrainingCourse,
        on_delete=models.CASCADE,
        related_name='sessions',
        verbose_name=_('培训课程')
    )
    trainer = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='training_sessions_as_trainer',
        limit_choices_to={'role__in': ['trainer', 'admin']},
        verbose_name=_('培训师')
    )
    start_time = models.DateTimeField(_('开始时间'))
    end_time = models.DateTimeField(_('结束时间'))
    location = models.CharField(_('培训地点'), max_length=200)
    max_participants = models.IntegerField(_('最大人数'))
    current_participants = models.IntegerField(_('当前人数'), default=0)
    notes = models.TextField(_('备注'), blank=True)

    class Meta:
        verbose_name = _('培训场次')
        verbose_name_plural = _('培训场次')
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['course', 'start_time']),
            models.Index(fields=['trainer', 'start_time']),
            models.Index(fields=['start_time']),
        ]

    def __str__(self):
        return f'{self.course.name} - {self.start_time.strftime("%Y-%m-%d %H:%M")}'

    @property
    def is_full(self):
        return self.current_participants >= self.max_participants


class TrainingApplication(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'pending', _('待审核')
        APPROVED = 'approved', _('已通过')
        REJECTED = 'rejected', _('已拒绝')
        CANCELLED = 'cancelled', _('已取消')
        COMPLETED = 'completed', _('已完成')

    session = models.ForeignKey(
        TrainingSession,
        on_delete=models.CASCADE,
        related_name='applications',
        verbose_name=_('培训场次')
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='training_applications',
        verbose_name=_('申请人')
    )
    status = models.CharField(_('状态'), max_length=20, choices=Status.choices, default=Status.PENDING)
    application_notes = models.TextField(_('申请说明'), blank=True)
    review_notes = models.TextField(_('审核说明'), blank=True)
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='training_reviews',
        null=True,
        blank=True,
        verbose_name=_('审核人')
    )
    reviewed_at = models.DateTimeField(_('审核时间'), null=True, blank=True)

    class Meta:
        verbose_name = _('培训申请')
        verbose_name_plural = _('培训申请')
        ordering = ['-created_at']
        unique_together = ['session', 'user']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['session', 'status']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'{self.user.real_name} - {self.session.course.name}'


class TrainingCertification(BaseModel):
    class Status(models.TextChoices):
        VALID = 'valid', _('有效')
        EXPIRED = 'expired', _('已过期')
        REVOKED = 'revoked', _('已吊销')

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='certifications',
        verbose_name=_('持证人')
    )
    course = models.ForeignKey(
        TrainingCourse,
        on_delete=models.PROTECT,
        related_name='certifications',
        verbose_name=_('培训课程')
    )
    category = models.ForeignKey(
        EquipmentCategory,
        on_delete=models.PROTECT,
        related_name='certifications',
        verbose_name=_('设备类别')
    )
    issued_date = models.DateField(_('颁发日期'))
    expiry_date = models.DateField(_('有效期至'), null=True, blank=True)
    issued_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='issued_certifications',
        verbose_name=_('颁发人')
    )
    status = models.CharField(_('状态'), max_length=20, choices=Status.choices, default=Status.VALID)
    certificate_number = models.CharField(_('证书编号'), max_length=50, unique=True)
    score = models.DecimalField(_('考核成绩'), max_digits=5, decimal_places=2, null=True, blank=True)
    notes = models.TextField(_('备注'), blank=True)
    certificate_file = models.FileField(_('证书文件'), upload_to='certificates/', blank=True, null=True)

    class Meta:
        verbose_name = _('培训资格证书')
        verbose_name_plural = _('培训资格证书')
        ordering = ['-issued_date']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['certificate_number']),
            models.Index(fields=['expiry_date']),
        ]

    def __str__(self):
        return f'{self.user.real_name} - {self.course.name}'


auditlog.register(TrainingCourse)
auditlog.register(TrainingSession)
auditlog.register(TrainingApplication)
auditlog.register(TrainingCertification)
