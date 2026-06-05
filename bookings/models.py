from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from core.models import BaseModel, User
from equipment.models import Equipment
from auditlog.registry import auditlog
from datetime import timedelta


class Booking(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'pending', _('待审批')
        APPROVED = 'approved', _('已确认')
        REJECTED = 'rejected', _('已拒绝')
        CANCELLED = 'cancelled', _('已取消')
        IN_PROGRESS = 'in_progress', _('使用中')
        COMPLETED = 'completed', _('已完成')
        NO_SHOW = 'no_show', _('未到场')

    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.PROTECT,
        related_name='bookings',
        verbose_name=_('设备')
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bookings',
        verbose_name=_('预约人')
    )
    start_time = models.DateTimeField(_('开始时间'))
    end_time = models.DateTimeField(_('结束时间'))
    purpose = models.TextField(_('使用目的'))
    status = models.CharField(_('状态'), max_length=20, choices=Status.choices, default=Status.PENDING)
    approval_notes = models.TextField(_('审批备注'), blank=True)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='approved_bookings',
        null=True,
        blank=True,
        verbose_name=_('审批人')
    )
    approved_at = models.DateTimeField(_('审批时间'), null=True, blank=True)
    actual_start_time = models.DateTimeField(_('实际开始时间'), null=True, blank=True)
    actual_end_time = models.DateTimeField(_('实际结束时间'), null=True, blank=True)
    check_in_code = models.CharField(_('签到码'), max_length=10, blank=True)
    is_checked_in = models.BooleanField(_('已签到'), default=False)
    checked_in_at = models.DateTimeField(_('签到时间'), null=True, blank=True)

    class Meta:
        verbose_name = _('设备预约')
        verbose_name_plural = _('设备预约')
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['equipment', 'start_time', 'end_time']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'start_time']),
            models.Index(fields=['start_time']),
        ]

    def __str__(self):
        return f'{self.equipment.name} - {self.user.real_name} - {self.start_time.strftime("%Y-%m-%d")}'

    def clean(self):
        super().clean()
        if self.start_time >= self.end_time:
            raise ValidationError(_('结束时间必须晚于开始时间'))
        duration = self.end_time - self.start_time
        max_duration = timedelta(hours=self.equipment.max_booking_hours)
        if duration > max_duration:
            raise ValidationError(
                _('预约时长不能超过 %(max_hours)d 小时') % {'max_hours': self.equipment.max_booking_hours}
            )

    @property
    def duration_hours(self):
        return (self.end_time - self.start_time).total_seconds() / 3600


class BookingConflict(models.Model):
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='conflicts',
        verbose_name=_('预约')
    )
    conflicting_booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='conflicting_with',
        verbose_name=_('冲突预约')
    )
    detected_at = models.DateTimeField(_('检测时间'), auto_now_add=True)

    class Meta:
        verbose_name = _('预约冲突')
        verbose_name_plural = _('预约冲突')


auditlog.register(Booking)
