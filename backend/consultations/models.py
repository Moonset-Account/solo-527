from django.db import models
from django.conf import settings
from leads.models import Lead, Customer


class ConsultationRecord(models.Model):
    CONSULTATION_TYPE_CHOICES = [
        ('initial', '初诊咨询'),
        ('followup', '复诊咨询'),
        ('treatment', '方案咨询'),
        ('price', '价格咨询'),
        ('other', '其他'),
    ]

    INTENTION_LEVEL_CHOICES = [
        ('high', '高意向'),
        ('medium', '中意向'),
        ('low', '低意向'),
        ('none', '无意向'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='consultations', null=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='consultations')
    consultation_type = models.CharField(max_length=20, choices=CONSULTATION_TYPE_CHOICES, default='initial')
    intention_level = models.CharField(max_length=20, choices=INTENTION_LEVEL_CHOICES, default='medium')
    chief_complaint = models.TextField(blank=True, default='', help_text='主诉')
    dental_history = models.TextField(blank=True, default='', help_text='牙科病史')
    oral_examination = models.TextField(blank=True, default='', help_text='口腔检查')
    diagnosis = models.TextField(blank=True, default='', help_text='诊断结果')
    treatment_plan = models.TextField(blank=True, default='', help_text='治疗方案')
    estimated_price = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text='预估价格')
    patient_concerns = models.TextField(blank=True, default='', help_text='患者顾虑')
    next_action = models.TextField(blank=True, default='', help_text='下一步行动')
    next_consultation_at = models.DateTimeField(null=True, blank=True)
    consultation_doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='doctor_consultations')
    consultant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='consultant_consultations')
    duration_minutes = models.IntegerField(default=30)
    notes = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_consultations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.customer.name} - {self.get_consultation_type_display()}"


class ConsultationAttachment(models.Model):
    consultation = models.ForeignKey(ConsultationRecord, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='consultations/')
    file_name = models.CharField(max_length=255, blank=True, default='')
    file_type = models.CharField(max_length=50, blank=True, default='')
    description = models.CharField(max_length=255, blank=True, default='')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.file_name or self.file.name


class TreatmentItem(models.Model):
    CATEGORY_CHOICES = [
        ('examination', '检查类'),
        ('cleaning', '洁牙类'),
        ('filling', '补牙类'),
        ('endodontic', '根管类'),
        ('crown', '牙冠类'),
        ('implant', '种植类'),
        ('orthodontics', '正畸类'),
        ('cosmetic', '美容类'),
        ('surgery', '手术类'),
        ('other', '其他'),
    ]

    name = models.CharField(max_length=200, unique=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    description = models.TextField(blank=True, default='')
    duration_minutes = models.IntegerField(default=30)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return self.name


class ConsultationTreatmentItem(models.Model):
    consultation = models.ForeignKey(ConsultationRecord, on_delete=models.CASCADE, related_name='treatment_items')
    treatment_item = models.ForeignKey(TreatmentItem, on_delete=models.CASCADE, related_name='consultation_items')
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='折扣百分比')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.treatment_item.name} x {self.quantity}"

    def save(self, *args, **kwargs):
        if not self.unit_price and self.treatment_item:
            self.unit_price = self.treatment_item.price
        discount_amount = self.unit_price * self.discount / 100
        self.subtotal = (self.unit_price - discount_amount) * self.quantity
        super().save(*args, **kwargs)
