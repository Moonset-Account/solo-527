from django.db import models
from django.contrib.auth import get_user_model
from apps.conversations.models import Message

User = get_user_model()


class Review(models.Model):
    STATUS_CHOICES = [
        ('pending', '待审核'),
        ('approved', '已通过'),
        ('rejected', '已拒绝'),
        ('flagged', '需关注'),
    ]

    REVIEW_TYPE_CHOICES = [
        ('content', '内容审核'),
        ('quality', '质量审核'),
        ('safety', '安全审核'),
    ]

    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reviews', verbose_name='消息')
    review_type = models.CharField(max_length=50, choices=REVIEW_TYPE_CHOICES, verbose_name='审核类型', db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='审核状态', db_index=True)
    reviewer = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews', verbose_name='审核人')
    comment = models.TextField(blank=True, verbose_name='审核意见')
    risk_level = models.CharField(max_length=20, blank=True, verbose_name='风险等级')
    flagged_by_ai = models.BooleanField(default=False, verbose_name='AI标记')
    sales_operation = models.CharField(max_length=50, blank=True, verbose_name='销售运营分组', db_index=True)
    prompt_version = models.CharField(max_length=50, blank=True, verbose_name='提示词版本', db_index=True)
    ai_model = models.CharField(max_length=100, blank=True, verbose_name='AI模型')
    is_accurate = models.BooleanField(null=True, blank=True, verbose_name='是否准确', db_index=True)
    inaccuracy_reason = models.CharField(max_length=100, blank=True, verbose_name='不准确原因')
    risk_tags = models.JSONField(default=list, blank=True, verbose_name='风险标签')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间', db_index=True)
    reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name='审核时间')

    class Meta:
        db_table = 'reviews'
        verbose_name = '审核记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_review_type_display()} - {self.get_status_display()}'


class ReviewRule(models.Model):
    name = models.CharField(max_length=255, verbose_name='规则名称')
    description = models.TextField(blank=True, verbose_name='规则描述')
    rule_type = models.CharField(max_length=50, verbose_name='规则类型')
    pattern = models.TextField(verbose_name='匹配规则')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    severity = models.CharField(max_length=20, default='medium', verbose_name='严重程度')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'review_rules'
        verbose_name = '审核规则'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.name
