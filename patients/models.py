from django.db import models
from django.utils.translation import gettext_lazy as _
from phonenumber_field.modelfields import PhoneNumberField
from core.models import User


class ChronicDisease(models.Model):
    name = models.CharField(max_length=100, verbose_name=_('疾病名称'))
    icd_code = models.CharField(max_length=20, blank=True, verbose_name=_('ICD编码'))
    description = models.TextField(blank=True, verbose_name=_('描述'))
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('慢病类型')
        verbose_name_plural = _('慢病类型')
        ordering = ['name']

    def __str__(self):
        return self.name


class PatientProfile(models.Model):
    class Gender(models.TextChoices):
        MALE = 'M', _('男')
        FEMALE = 'F', _('女')
        OTHER = 'O', _('其他')

    class MaritalStatus(models.TextChoices):
        SINGLE = 'SINGLE', _('未婚')
        MARRIED = 'MARRIED', _('已婚')
        DIVORCED = 'DIVORCED', _('离异')
        WIDOWED = 'WIDOWED', _('丧偶')

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='patient_profile',
        verbose_name=_('关联用户')
    )
    patient_no = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_('病历号')
    )
    name = models.CharField(max_length=100, verbose_name=_('姓名'))
    gender = models.CharField(
        max_length=10,
        choices=Gender.choices,
        verbose_name=_('性别')
    )
    birth_date = models.DateField(verbose_name=_('出生日期'))
    id_card = models.CharField(
        max_length=18,
        unique=True,
        verbose_name=_('身份证号')
    )
    phone = PhoneNumberField(verbose_name=_('手机号'), region='CN')
    emergency_contact = models.CharField(
        max_length=100,
        verbose_name=_('紧急联系人')
    )
    emergency_phone = PhoneNumberField(
        verbose_name=_('紧急联系人电话'),
        region='CN'
    )
    address = models.TextField(blank=True, verbose_name=_('住址'))
    marital_status = models.CharField(
        max_length=20,
        choices=MaritalStatus.choices,
        default=MaritalStatus.SINGLE,
        verbose_name=_('婚姻状况')
    )
    chronic_diseases = models.ManyToManyField(
        ChronicDisease,
        blank=True,
        related_name='patients',
        verbose_name=_('慢病')
    )
    allergies = models.TextField(blank=True, verbose_name=_('过敏史'))
    medical_history = models.TextField(blank=True, verbose_name=_('既往病史'))
    height = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_('身高(cm)')
    )
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_('体重(kg)')
    )
    blood_type = models.CharField(
        max_length=5,
        blank=True,
        verbose_name=_('血型')
    )
    is_active = models.BooleanField(default=True, verbose_name=_('是否有效'))
    no_show_count = models.IntegerField(
        default=0,
        verbose_name=_('爽约次数')
    )
    needs_confirmation = models.BooleanField(
        default=False,
        verbose_name=_('需要电话确认')
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_patients',
        verbose_name=_('创建人')
    )

    class Meta:
        verbose_name = _('患者档案')
        verbose_name_plural = _('患者档案')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.patient_no} - {self.name}'

    @property
    def age(self):
        from datetime import date
        today = date.today()
        return today.year - self.birth_date.year - (
            (today.month, today.day) < (self.birth_date.month, self.birth_date.day)
        )

    def increment_no_show(self):
        self.no_show_count += 1
        from django.conf import settings
        threshold = settings.APPOINTMENT_SETTINGS.get('NO_SHOW_THRESHOLD', 3)
        if self.no_show_count >= threshold:
            self.needs_confirmation = True
        self.save()

    def reset_no_show(self):
        self.no_show_count = 0
        self.needs_confirmation = False
        self.save()
