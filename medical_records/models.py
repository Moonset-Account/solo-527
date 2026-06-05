from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import User
from patients.models import PatientProfile
from doctors.models import DoctorProfile
from appointments.models import Appointment, FollowUpPlan


class MedicalRecordPermission(models.Model):
    class PermissionLevel(models.TextChoices):
        READ = 'READ', _('只读')
        WRITE = 'WRITE', _('可编辑')
        FULL = 'FULL', _('完全控制')

    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='record_permissions',
        verbose_name=_('患者')
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='record_permissions',
        verbose_name=_('授权用户')
    )
    permission_level = models.CharField(
        max_length=20,
        choices=PermissionLevel.choices,
        default=PermissionLevel.READ,
        verbose_name=_('权限级别')
    )
    granted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='granted_permissions',
        verbose_name=_('授权人')
    )
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('过期时间')
    )
    is_active = models.BooleanField(default=True, verbose_name=_('是否有效'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('病历权限')
        verbose_name_plural = _('病历权限')
        unique_together = ['patient', 'user']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username} -> {self.patient.name} ({self.get_permission_level_display()})'


class MedicalSummary(models.Model):
    patient = models.OneToOneField(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='medical_summary',
        verbose_name=_('患者')
    )
    chief_complaint = models.TextField(
        blank=True,
        verbose_name=_('主诉')
    )
    present_illness = models.TextField(
        blank=True,
        verbose_name=_('现病史')
    )
    past_illness = models.TextField(
        blank=True,
        verbose_name=_('既往史')
    )
    family_history = models.TextField(
        blank=True,
        verbose_name=_('家族史')
    )
    personal_history = models.TextField(
        blank=True,
        verbose_name=_('个人史')
    )
    physical_exam = models.TextField(
        blank=True,
        verbose_name=_('体格检查')
    )
    auxiliary_exam = models.TextField(
        blank=True,
        verbose_name=_('辅助检查')
    )
    diagnosis = models.TextField(
        blank=True,
        verbose_name=_('诊断')
    )
    treatment_plan = models.TextField(
        blank=True,
        verbose_name=_('治疗方案')
    )
    notes = models.TextField(
        blank=True,
        verbose_name=_('备注')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_summaries',
        verbose_name=_('创建人')
    )
    last_updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='updated_summaries',
        verbose_name=_('最后更新人')
    )

    class Meta:
        verbose_name = _('病历摘要')
        verbose_name_plural = _('病历摘要')

    def __str__(self):
        return f'{self.patient.name} 的病历摘要'

    def can_view(self, user):
        if user.is_superuser or user.role == 'ADMIN':
            return True
        if user == self.patient.user:
            return True
        perm = MedicalRecordPermission.objects.filter(
            patient=self.patient,
            user=user,
            is_active=True
        ).first()
        return perm is not None

    def can_edit(self, user):
        if user.is_superuser or user.role == 'ADMIN':
            return True
        perm = MedicalRecordPermission.objects.filter(
            patient=self.patient,
            user=user,
            is_active=True,
            permission_level__in=['WRITE', 'FULL']
        ).first()
        return perm is not None


class FollowUpRecord(models.Model):
    followup_plan = models.ForeignKey(
        FollowUpPlan,
        on_delete=models.CASCADE,
        related_name='followup_records',
        verbose_name=_('关联复诊计划')
    )
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='followup_records',
        verbose_name=_('关联预约')
    )
    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='followup_records',
        verbose_name=_('患者')
    )
    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.PROTECT,
        related_name='followup_records',
        verbose_name=_('随访医生')
    )
    visit_number = models.IntegerField(
        default=1,
        verbose_name=_('第几次随访')
    )
    visit_date = models.DateField(verbose_name=_('随访日期'))
    symptoms = models.TextField(
        blank=True,
        verbose_name=_('症状描述')
    )
    physical_exam = models.TextField(
        blank=True,
        verbose_name=_('体格检查')
    )
    blood_pressure = models.CharField(
        max_length=20,
        blank=True,
        verbose_name=_('血压')
    )
    heart_rate = models.IntegerField(
        null=True,
        blank=True,
        verbose_name=_('心率')
    )
    blood_sugar = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_('血糖')
    )
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_('体重(kg)')
    )
    exam_results = models.TextField(
        blank=True,
        verbose_name=_('检查结果')
    )
    diagnosis = models.TextField(
        blank=True,
        verbose_name=_('诊断意见')
    )
    medication_adjustment = models.TextField(
        blank=True,
        verbose_name=_('用药调整')
    )
    lifestyle_advice = models.TextField(
        blank=True,
        verbose_name=_('生活方式建议')
    )
    next_visit_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_('下次随访日期')
    )
    notes = models.TextField(
        blank=True,
        verbose_name=_('其他备注')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_followup_records',
        verbose_name=_('记录人')
    )

    class Meta:
        verbose_name = _('随访记录')
        verbose_name_plural = _('随访记录')
        ordering = ['-visit_date', '-created_at']

    def __str__(self):
        return f'{self.patient.name} - 第{self.visit_number}次随访 ({self.visit_date})'

    def save(self, *args, **kwargs):
        if not self.pk and self.followup_plan:
            max_visit = FollowUpRecord.objects.filter(
                followup_plan=self.followup_plan
            ).aggregate(models.Max('visit_number'))['visit_number__max'] or 0
            self.visit_number = max_visit + 1
        super().save(*args, **kwargs)


class Prescription(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('草稿')
        ACTIVE = 'ACTIVE', _('生效中')
        COMPLETED = 'COMPLETED', _('已完成')
        CANCELLED = 'CANCELLED', _('已取消')

    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name='prescriptions',
        verbose_name=_('关联预约')
    )
    patient = models.ForeignKey(
        PatientProfile,
        on_delete=models.CASCADE,
        related_name='prescriptions',
        verbose_name=_('患者')
    )
    doctor = models.ForeignKey(
        DoctorProfile,
        on_delete=models.PROTECT,
        related_name='prescriptions',
        verbose_name=_('开方医生')
    )
    prescription_no = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_('处方号')
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name=_('状态')
    )
    notes = models.TextField(blank=True, verbose_name=_('医嘱'))
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_prescriptions',
        verbose_name=_('创建人')
    )

    class Meta:
        verbose_name = _('处方')
        verbose_name_plural = _('处方')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.prescription_no} - {self.patient.name}'

    def save(self, *args, **kwargs):
        if not self.prescription_no:
            from datetime import datetime
            today = datetime.now().strftime('%Y%m%d')
            count = Prescription.objects.filter(
                created_at__date=datetime.now().date()
            ).count() + 1
            self.prescription_no = f'RX{today}{count:04d}'
        super().save(*args, **kwargs)


class PrescriptionItem(models.Model):
    prescription = models.ForeignKey(
        Prescription,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name=_('处方')
    )
    medication_name = models.CharField(max_length=200, verbose_name=_('药品名称'))
    specification = models.CharField(max_length=100, verbose_name=_('规格'))
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name=_('数量')
    )
    unit = models.CharField(max_length=20, verbose_name=_('单位'))
    dosage = models.CharField(max_length=100, verbose_name=_('剂量'))
    frequency = models.CharField(max_length=100, verbose_name=_('用法'))
    duration = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_('疗程')
    )
    notes = models.TextField(blank=True, verbose_name=_('备注'))
    sort_order = models.IntegerField(default=0, verbose_name=_('排序'))

    class Meta:
        verbose_name = _('处方明细')
        verbose_name_plural = _('处方明细')
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f'{self.medication_name} - {self.prescription.prescription_no}'
