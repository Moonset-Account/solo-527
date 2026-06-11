from django.db import models
from django.contrib.auth import get_user_model
from apps.conversations.models import Conversation, Message

User = get_user_model()


class RiskSample(models.Model):
    RISK_LEVEL_CHOICES = [
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
        ('critical', '严重'),
    ]

    RISK_CATEGORY_CHOICES = [
        ('sensitive_word', '敏感词'),
        ('privacy_leak', '隐私泄露'),
        ('misinformation', '错误信息'),
        ('compliance_risk', '合规风险'),
        ('other', '其他'),
    ]

    SOURCE_CHOICES = [
        ('ai_flag', 'AI标记'),
        ('manual', '人工录入'),
        ('review', '审核发现'),
        ('import', '批量导入'),
    ]

    STATUS_CHOICES = [
        ('pending', '待处理'),
        ('confirmed', '已确认'),
        ('resolved', '已解决'),
        ('false_positive', '误报'),
    ]

    title = models.CharField(max_length=255, verbose_name='标题')
    content = models.TextField(verbose_name='内容')
    risk_level = models.CharField(max_length=20, choices=RISK_LEVEL_CHOICES, default='medium', verbose_name='风险等级', db_index=True)
    risk_category = models.CharField(max_length=50, choices=RISK_CATEGORY_CHOICES, default='other', verbose_name='风险分类', db_index=True)
    source = models.CharField(max_length=50, choices=SOURCE_CHOICES, default='manual', verbose_name='来源', db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='状态', db_index=True)
    tags = models.JSONField(default=list, blank=True, verbose_name='标签')
    conversation = models.ForeignKey(Conversation, on_delete=models.SET_NULL, null=True, blank=True, related_name='risk_samples', verbose_name='关联会话')
    message = models.ForeignKey(Message, on_delete=models.SET_NULL, null=True, blank=True, related_name='risk_samples', verbose_name='关联消息')
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_risks', verbose_name='处理人')
    handled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='handled_risks', verbose_name='实际处理人')
    handle_comment = models.TextField(blank=True, verbose_name='处理意见')
    handled_at = models.DateTimeField(null=True, blank=True, verbose_name='处理时间')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间', db_index=True)
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'risk_samples'
        verbose_name = '风险样本'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class RiskRule(models.Model):
    RULE_TYPE_CHOICES = [
        ('keyword', '关键词'),
        ('regex', '正则表达式'),
        ('ai_detect', 'AI检测'),
    ]

    RISK_LEVEL_CHOICES = [
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
        ('critical', '严重'),
    ]

    name = models.CharField(max_length=100, verbose_name='规则名称')
    rule_type = models.CharField(max_length=20, choices=RULE_TYPE_CHOICES, default='keyword', verbose_name='规则类型', db_index=True)
    pattern = models.TextField(verbose_name='匹配模式')
    risk_level = models.CharField(max_length=20, choices=RISK_LEVEL_CHOICES, default='medium', verbose_name='风险等级', db_index=True)
    is_active = models.BooleanField(default=True, verbose_name='是否启用', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'risk_rules'
        verbose_name = '风险规则'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.name
