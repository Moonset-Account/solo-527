from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import User, Department


class DoctorProfile(models.Model):
    class Title(models.TextChoices):
        INTERN = 'INTERN', _('实习医师')
        RESIDENT = 'RESIDENT', _('住院医师')
        ATTENDING = 'ATTENDING', _('主治医师')
        ASSOCIATE = 'ASSOCIATE', _('副主任医师')
        CHIEF = 'CHIEF', _('主任医师')

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='doctor_profile',
        verbose_name=_('关联用户')
    )
    name = models.CharField(max_length=100, verbose_name=_('姓名'))
    employee_no = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_('工号')
    )
    title = models.CharField(
        max_length=20,
        choices=Title.choices,
        default=Title.RESIDENT,
        verbose_name=_('职称')
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name='doctors',
        verbose_name=_('所属科室')
    )
    specialties = models.TextField(blank=True, verbose_name=_('擅长领域'))
    consultation_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name=_('挂号费')
    )
    is_active = models.BooleanField(default=True, verbose_name=_('是否在职'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('医生档案')
        verbose_name_plural = _('医生档案')
        ordering = ['department', 'name']

    def __str__(self):
        return f'{self.department.name} - {self.name} ({self.get_title_display()})'


class DoctorSchedule(models.Model):
    class Shift(models.TextChoices):
        MORNING = 'MORNING', _('上午')
        AFTERNOON = 'AFTERNOON', _('下午')
        EVENING = 'EVENING', _('晚间')

    class DayOfWeek(models.IntegerChoices):
        MONDAY = 0, _('周一')
        TUESDAY = 1, _('周二')
        WEDNESDAY = 2, _('周三')
        THURSDAY = 3, _('周四')
        FRIDAY = 4, _('周五')
        SATURDAY = 5, _('周六')
        SUNDAY = 6, _('周日')

    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.CASCADE,
        related_name='schedules',
        verbose_name=_('医生')
    )
    day_of_week = models.IntegerField(
        choices=DayOfWeek.choices,
        verbose_name=_('星期')
    )
    shift = models.CharField(
        max_length=20,
        choices=Shift.choices,
        verbose_name=_('班次')
    )
    max_patients = models.IntegerField(
        default=20,
        verbose_name=_('最大接诊数')
    )
    start_time = models.TimeField(verbose_name=_('开始时间'))
    end_time = models.TimeField(verbose_name=_('结束时间'))
    is_active = models.BooleanField(default=True, verbose_name=_('是否启用'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('医生排班')
        verbose_name_plural = _('医生排班')
        unique_together = ['doctor', 'day_of_week', 'shift']
        ordering = ['day_of_week', 'shift']

    def __str__(self):
        return f'{self.doctor.name} - {self.get_day_of_week_display()} {self.get_shift_display()}'


class DailySlot(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', _('可预约')
        FULL = 'FULL', _('已满')
        CANCELLED = 'CANCELLED', _('停诊')

    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.CASCADE,
        related_name='daily_slots',
        verbose_name=_('医生')
    )
    date = models.DateField(verbose_name=_('日期'))
    shift = models.CharField(
        max_length=20,
        choices=DoctorSchedule.Shift.choices,
        verbose_name=_('班次')
    )
    max_patients = models.IntegerField(
        default=20,
        verbose_name=_('最大接诊数')
    )
    booked_count = models.IntegerField(
        default=0,
        verbose_name=_('已预约数')
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
        verbose_name=_('状态')
    )
    cancel_reason = models.TextField(blank=True, verbose_name=_('停诊原因'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('每日号源')
        verbose_name_plural = _('每日号源')
        unique_together = ['doctor', 'date', 'shift']
        ordering = ['-date', 'shift']

    def __str__(self):
        return f'{self.doctor.name} - {self.date} {self.get_shift_display()}'

    @property
    def available_slots(self):
        return max(0, self.max_patients - self.booked_count)

    def update_booked_count(self):
        from appointments.models import Appointment
        self.booked_count = Appointment.objects.filter(
            daily_slot=self,
            status__in=['BOOKED', 'CHECKED_IN', 'IN_PROGRESS']
        ).count()
        if self.booked_count >= self.max_patients and self.status == 'AVAILABLE':
            self.status = 'FULL'
        elif self.booked_count < self.max_patients and self.status == 'FULL':
            self.status = 'AVAILABLE'
        self.save()
