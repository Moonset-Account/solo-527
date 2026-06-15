from django.db import models
from django.conf import settings
from leads.models import Lead, Customer
from consultations.models import ConsultationRecord


class ContractStatus(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, default='')
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class Contract(models.Model):
    CONTRACT_TYPE_CHOICES = [
        ('treatment', '治疗合同'),
        ('orthodontics', '正畸合同'),
        ('implant', '种植合同'),
        ('cosmetic', '美容合同'),
        ('comprehensive', '综合合同'),
        ('other', '其他'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('unpaid', '未付款'),
        ('partial', '部分付款'),
        ('paid', '已付清'),
        ('refunded', '已退款'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name='contracts')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='contracts')
    consultation = models.ForeignKey(ConsultationRecord, on_delete=models.SET_NULL, null=True, blank=True, related_name='contracts')
    contract_no = models.CharField(max_length=50, unique=True)
    contract_type = models.CharField(max_length=20, choices=CONTRACT_TYPE_CHOICES, default='treatment')
    status = models.ForeignKey(ContractStatus, on_delete=models.SET_NULL, null=True, blank=True, related_name='contracts')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='unpaid')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text='折扣百分比')
    actual_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    treatment_plan = models.TextField(blank=True, default='')
    treatment_cycle = models.CharField(max_length=200, blank=True, default='')
    warranty_info = models.TextField(blank=True, default='')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    sales_person = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='sold_contracts')
    doctor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='doctor_contracts')
    approval_status = models.CharField(max_length=20, default='pending', choices=[
        ('pending', '待审批'),
        ('approved', '已批准'),
        ('rejected', '已拒绝'),
        ('revision', '待修改'),
    ])
    discount_reason = models.TextField(blank=True, default='', help_text='折扣申请理由')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_contracts')
    approved_at = models.DateTimeField(null=True, blank=True)
    approval_comments = models.TextField(blank=True, default='')
    signed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_contracts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['contract_no']),
            models.Index(fields=['status']),
            models.Index(fields=['approval_status']),
            models.Index(fields=['payment_status']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.contract_no} - {self.customer.name}"

    def save(self, *args, **kwargs):
        if self.total_amount > 0 and self.discount_percent > 0:
            self.discount_amount = self.total_amount * self.discount_percent / 100
        self.actual_amount = self.total_amount - self.discount_amount
        super().save(*args, **kwargs)


class ContractItem(models.Model):
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='items')
    item_name = models.CharField(max_length=200)
    category = models.CharField(max_length=50, blank=True, default='')
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.CharField(max_length=255, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.item_name} x {self.quantity}"

    def save(self, *args, **kwargs):
        discount_amount = self.unit_price * self.discount / 100
        self.subtotal = (self.unit_price - discount_amount) * self.quantity
        super().save(*args, **kwargs)


class ContractAttachment(models.Model):
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='contracts/')
    file_name = models.CharField(max_length=255, blank=True, default='')
    file_type = models.CharField(max_length=50, blank=True, default='')
    description = models.CharField(max_length=255, blank=True, default='')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.file_name or self.file.name


class ApprovalRecord(models.Model):
    ACTION_CHOICES = [
        ('submit', '提交审批'),
        ('approve', '批准'),
        ('reject', '拒绝'),
        ('revision', '要求修改'),
        ('comment', '备注'),
    ]

    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='approval_records')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES, default='submit')
    comments = models.TextField(blank=True, default='')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.contract.contract_no} - {self.get_action_display()}"


class PaymentRecord(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('cash', '现金'),
        ('wechat', '微信'),
        ('alipay', '支付宝'),
        ('bank', '银行转账'),
        ('card', '刷卡'),
        ('installment', '分期付款'),
        ('other', '其他'),
    ]

    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='cash')
    payment_date = models.DateField(auto_now_add=True)
    receipt_no = models.CharField(max_length=50, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.contract.contract_no} - {self.amount}"
