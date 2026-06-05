from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import User
from patients.models import PatientProfile
from doctors.models import DoctorProfile, DailySlot


class FollowUpPlan(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', _('进行中')
        COMPLETED = 'COMPLETED', _('已完成')
        CANCELLED = 'CANCELLED', _('已取消')

    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='followup_plans',
        verbose_name=_('患者')
    )
    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.PROTECT,
        related_name='followup_plans',
        verbose_name=_('负责医生')
    )
    title = models.CharField(max_length=200, verbose_name=_('计划标题'))
    description = models.TextField(blank=True, verbose_name=_('计划描述'))
    total_visits = models.IntegerField(
        default=1,
        verbose_name=_('总复诊次数')
    )
    interval_days = models.IntegerField(
        default=30,
        verbose_name=_('复诊间隔(天)')
    )
    start_date = models.DateField(verbose_name=_('开始日期'))
    next_appointment_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_('下次复诊日期')
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name=_('状态')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_followup_plans',
        verbose_name=_('创建人(护士)')
    )

    class Meta:
        verbose_name = _('复诊计划')
        verbose_name_plural = _('复诊计划')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.patient.name} - {self.title}'


class RescheduleReason(models.Model):
    class Category(models.TextChoices):
        DOCTOR_ABSENT = 'DOCTOR_ABSENT', _('医生停诊')
        PATIENT_REQUEST = 'PATIENT_REQUEST', _('患者主动申请')
        MEDICINE_SHORTAGE = 'MEDICINE_SHORTAGE', _('药品缺货')
        OTHER = 'OTHER', _('其他原因')

    category = models.CharField(
        max_length=30,
        choices=Category.choices,
        verbose_name=_('改期分类')
    )
    name = models.CharField(max_length=100, verbose_name=_('改期原因'))
    description = models.TextField(blank=True, verbose_name=_('详细说明'))
    is_active = models.BooleanField(default=True, verbose_name=_('是否启用'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('改期原因')
        verbose_name_plural = _('改期原因')
        ordering = ['category', 'name']

    def __str__(self):
        return f'{self.get_category_display()} - {self.name}'


class Appointment(models.Model):
    class Status(models.TextChoices):
        BOOKED = 'BOOKED', _('已预约')
        CHECKED_IN = 'CHECKED_IN', _('已签到')
        IN_PROGRESS = 'IN_PROGRESS', _('就诊中')
        COMPLETED = 'COMPLETED', _('已完成')
        CANCELLED = 'CANCELLED', _('已取消')
        NO_SHOW = 'NO_SHOW', _('爽约')
        RESCHEDULED = 'RESCHEDULED', _('已改期')

    class PaymentStatus(models.TextChoices):
        UNPAID = 'UNPAID', _('未缴费')
        PAID = 'PAID', _('已缴费')
        REFUNDED = 'REFUNDED', _('已退款')

    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name=_('患者')
    )
    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.PROTECT,
        related_name='appointments',
        verbose_name=_('医生')
    )
    daily_slot = models.ForeignKey(
        DailySlot,
        on_delete=models.PROTECT,
        related_name='appointments',
        verbose_name=_('号源')
    )
    followup_plan = models.ForeignKey(
        FollowUpPlan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments',
        verbose_name=_('关联复诊计划')
    )
    appointment_no = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_('预约号')
    )
    queue_number = models.IntegerField(
        null=True,
        blank=True,
        verbose_name=_('排队序号')
    )
    reason = models.TextField(verbose_name=_('预约原因'))
    original_reason = models.TextField(
        blank=True,
        verbose_name=_('原预约原因(改期保留)')
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.BOOKED,
        verbose_name=_('状态')
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID,
        verbose_name=_('缴费状态')
    )
    fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name=_('费用')
    )
    reschedule_reason = models.ForeignKey(
        RescheduleReason,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments',
        verbose_name=_('改期原因')
    )
    reschedule_note = models.TextField(
        blank=True,
        verbose_name=_('改期备注')
    )
    original_appointment = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rescheduled_to',
        verbose_name=_('原预约记录')
    )
    checked_in_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('签到时间')
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('完成时间')
    )
    cancelled_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('取消时间')
    )
    reminder_sent = models.BooleanField(
        default=False,
        verbose_name=_('提醒已发送')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_appointments',
        verbose_name=_('创建人')
    )

    class Meta:
        verbose_name = _('预约记录')
        verbose_name_plural = _('预约记录')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.appointment_no} - {self.patient.name} - {self.doctor.name}'

    def save(self, *args, **kwargs):
        if not self.appointment_no:
            from datetime import datetime
            today = datetime.now().strftime('%Y%m%d')
            count = Appointment.objects.filter(
                created_at__date=datetime.now().date()
            ).count() + 1
            self.appointment_no = f'APT{today}{count:04d}'
        super().save(*args, **kwargs)

    def check_in(self):
        from django.utils import timezone
        self.status = self.Status.CHECKED_IN
        self.checked_in_at = timezone.now()
        self.save()

    def start_consultation(self):
        self.status = self.Status.IN_PROGRESS
        self.save()

    def complete(self):
        from django.utils import timezone
        self.status = self.Status.COMPLETED
        self.completed_at = timezone.now()
        self.save()

    def cancel(self, reason=None, note=None):
        from django.utils import timezone
        self.status = self.Status.CANCELLED
        self.cancelled_at = timezone.now()
        if reason:
            self.reschedule_reason = reason
        if note:
            self.reschedule_note = note
        self.save()
        self.daily_slot.update_booked_count()

    def mark_no_show(self):
        self.status = self.Status.NO_SHOW
        self.save()
        self.patient.increment_no_show()
        self.daily_slot.update_booked_count()

    def reschedule(self, new_daily_slot, reason, note=''):
        from django.utils import timezone
        self.status = self.Status.RESCHEDULED
        self.reschedule_reason = reason
        self.reschedule_note = note
        self.cancelled_at = timezone.now()
        self.original_reason = self.reason
        self.save()
        self.daily_slot.update_booked_count()

        new_appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=new_daily_slot.doctor,
            daily_slot=new_daily_slot,
            followup_plan=self.followup_plan,
            reason=self.reason,
            original_reason=self.reason,
            fee=self.fee,
            original_appointment=self,
            created_by=self.created_by
        )
        new_daily_slot.update_booked_count()
        return new_appointment


class WaitingQueue(models.Model):
    class Status(models.TextChoices):
        WAITING = 'WAITING', _('等待中')
        CALLED = 'CALLED', _('已叫号')
        IN_PROGRESS = 'IN_PROGRESS', _('就诊中')
        COMPLETED = 'COMPLETED', _('已完成')
        LEFT = 'LEFT', _('已离开')

    appointment = models.OneToOneField(
        Appointment,
        on_delete=models.CASCADE,
        related_name='queue_entry',
        verbose_name=_('预约记录')
    )
    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.CASCADE,
        related_name='waiting_queue',
        verbose_name=_('医生')
    )
    queue_date = models.DateField(verbose_name=_('日期'))
    queue_number = models.IntegerField(verbose_name=_('排队号'))
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.WAITING,
        verbose_name=_('状态')
    )
    called_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('叫号时间')
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('完成时间')
    )
    estimated_wait_time = models.IntegerField(
        null=True,
        blank=True,
        verbose_name=_('预计等待时间(分钟)')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('候诊队列')
        verbose_name_plural = _('候诊队列')
        unique_together = ['doctor', 'queue_date', 'queue_number']
        ordering = ['queue_date', 'queue_number']

    def __str__(self):
        return f'{self.queue_date} {self.doctor.name} - {self.queue_number}号'

    def call_patient(self):
        from django.utils import timezone
        self.status = self.Status.CALLED
        self.called_at = timezone.now()
        self.save()

    def start_consultation(self):
        from django.utils import timezone
        self.status = self.Status.IN_PROGRESS
        self.called_at = self.called_at or timezone.now()
        self.save()

    def complete(self):
        from django.utils import timezone
        self.status = self.Status.COMPLETED
        self.completed_at = timezone.now()
        self.save()


class MedicationReminder(models.Model):
    class Frequency(models.TextChoices):
        ONCE_DAILY = 'QD', _('每日一次')
        TWICE_DAILY = 'BID', _('每日两次')
        THREE_TIMES = 'TID', _('每日三次')
        FOUR_TIMES = 'QID', _('每日四次')
        BEFORE_MEAL = 'AC', _('饭前')
        AFTER_MEAL = 'PC', _('饭后')
        BEDTIME = 'HS', _('睡前')
        AS_NEEDED = 'PRN', _('必要时')

    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='medication_reminders',
        verbose_name=_('患者')
    )
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='medication_reminders',
        verbose_name=_('关联预约')
    )
    medication_name = models.CharField(max_length=200, verbose_name=_('药品名称'))
    dosage = models.CharField(max_length=100, verbose_name=_('剂量'))
    frequency = models.CharField(
        max_length=20,
        choices=Frequency.choices,
        verbose_name=_('服用频率')
    )
    start_date = models.DateField(verbose_name=_('开始日期'))
    end_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_('结束日期')
    )
    notes = models.TextField(blank=True, verbose_name=_('备注'))
    is_active = models.BooleanField(default=True, verbose_name=_('是否启用'))
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_reminders',
        verbose_name=_('创建人')
    )

    class Meta:
        verbose_name = _('用药提醒')
        verbose_name_plural = _('用药提醒')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.patient.name} - {self.medication_name}'
