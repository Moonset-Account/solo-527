from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericRelation
from common.models import OperationLog


class LeadSource(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class LeadStatus(models.Model):
    STAGE_CHOICES = [
        ('new', '新线索'),
        ('contacted', '已联系'),
        ('consulting', '咨询中'),
        ('quoting', '报价中'),
        ('negotiating', '谈判中'),
        ('contracting', '签约中'),
        ('won', '已成交'),
        ('lost', '已流失'),
        ('public_sea', '公海'),
    ]

    name = models.CharField(max_length=100, unique=True)
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='new')
    description = models.TextField(blank=True, default='')
    sort_order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class Customer(models.Model):
    GENDER_CHOICES = [
        ('male', '男'),
        ('female', '女'),
        ('other', '其他'),
    ]

    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, unique=True)
    email = models.EmailField(blank=True, default='')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='other')
    age = models.IntegerField(null=True, blank=True)
    address = models.TextField(blank=True, default='')
    wechat = models.CharField(max_length=50, blank=True, default='')
    avatar = models.ImageField(upload_to='customers/', null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_customers')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['phone']),
            models.Index(fields=['name']),
        ]

    def __str__(self):
        return f"{self.name} - {self.phone}"


class Lead(models.Model):
    QUALITY_CHOICES = [
        ('high', '高质量'),
        ('medium', '中质量'),
        ('low', '低质量'),
    ]

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='leads')
    source = models.ForeignKey(LeadSource, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')
    status = models.ForeignKey(LeadStatus, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')
    quality = models.CharField(max_length=20, choices=QUALITY_CHOICES, default='medium')
    quality_score = models.IntegerField(default=50)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_leads')
    consultant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='consulting_leads')
    expected_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    actual_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    dental_issues = models.TextField(blank=True, default='', help_text='牙齿问题描述')
    treatment_plan = models.TextField(blank=True, default='', help_text='治疗方案')
    budget = models.CharField(max_length=100, blank=True, default='')
    urgency = models.CharField(max_length=50, blank=True, default='')
    is_public_sea = models.BooleanField(default=False)
    last_followup_at = models.DateTimeField(null=True, blank=True)
    next_followup_at = models.DateTimeField(null=True, blank=True)
    followup_count = models.IntegerField(default=0)
    is_timeout = models.BooleanField(default=False)
    timeout_reason = models.TextField(blank=True, default='')
    response_node = models.CharField(max_length=100, blank=True, default='', help_text='当前响应节点')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_leads')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    operation_logs = GenericRelation(OperationLog)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['assigned_to']),
            models.Index(fields=['is_public_sea']),
            models.Index(fields=['quality']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"线索 #{self.id} - {self.customer.name}"

    def calculate_quality_score(self):
        score = 50
        if self.customer.phone:
            score += 10
        if self.dental_issues:
            score += 10
        if self.budget:
            score += 10
        if self.expected_amount > 0:
            score += 10
        if self.source and self.source.name in ['老客户转介绍', '到店咨询']:
            score += 10
        if self.followup_count >= 3:
            score += 5
        self.quality_score = min(score, 100)
        if score >= 70:
            self.quality = 'high'
        elif score >= 40:
            self.quality = 'medium'
        else:
            self.quality = 'low'


class FollowupRecord(models.Model):
    FOLLOWUP_TYPE_CHOICES = [
        ('phone', '电话'),
        ('wechat', '微信'),
        ('visit', '到店'),
        ('email', '邮件'),
        ('sms', '短信'),
        ('other', '其他'),
    ]

    RESULT_CHOICES = [
        ('interested', '有意向'),
        ('considering', '考虑中'),
        ('not_interested', '无意向'),
        ('no_answer', '未接通'),
        ('appointment', '已预约'),
        ('other', '其他'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='followups')
    followup_type = models.CharField(max_length=20, choices=FOLLOWUP_TYPE_CHOICES, default='phone')
    result = models.CharField(max_length=20, choices=RESULT_CHOICES, default='other')
    content = models.TextField()
    next_followup_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_followups')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.lead} - {self.get_followup_type_display()}"


class TimeoutRecord(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='timeout_records')
    timeout_type = models.CharField(max_length=50, default='followup', help_text='超时类型')
    timeout_duration = models.FloatField(default=0, help_text='超时时长(小时)')
    reason = models.TextField(blank=True, default='')
    responsible_person = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='timeout_records')
    handled_at = models.DateTimeField(null=True, blank=True)
    handled_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='handled_timeouts')
    is_handled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.lead} - {self.timeout_type}超时"
