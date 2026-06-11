from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Conversation(models.Model):
    STATUS_CHOICES = [
        ('active', '进行中'),
        ('archived', '已归档'),
        ('deleted', '已删除'),
    ]

    CHANNEL_CHOICES = [
        ('web', '网页'),
        ('app', 'APP'),
        ('wechat', '微信'),
        ('phone', '电话'),
    ]

    PRIORITY_CHOICES = [
        ('normal', '普通'),
        ('high', '高'),
        ('urgent', '紧急'),
    ]

    title = models.CharField(max_length=255, verbose_name='会话标题')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations', verbose_name='用户')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='状态', db_index=True)
    customer_name = models.CharField(max_length=100, verbose_name='客户姓名', db_index=True)
    customer_phone = models.CharField(max_length=20, verbose_name='客户手机号', db_index=True)
    sales_operation = models.CharField(max_length=50, verbose_name='销售运营分组', db_index=True)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default='web', verbose_name='渠道', db_index=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='normal', verbose_name='优先级', db_index=True)
    ai_suggestion_adoption_rate = models.FloatField(default=0, verbose_name='AI建议采纳率')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间', db_index=True)
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'conversations'
        verbose_name = '会话'
        verbose_name_plural = verbose_name
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.customer_name} - {self.title}'


class Message(models.Model):
    ROLE_CHOICES = [
        ('user', '用户'),
        ('assistant', '助手'),
        ('system', '系统'),
    ]

    REVIEW_STATUS_CHOICES = [
        ('pending', '待审核'),
        ('approved', '已通过'),
        ('rejected', '已拒绝'),
        ('flagged', '需关注'),
    ]

    ERROR_TYPE_CHOICES = [
        ('none', '无'),
        ('timeout', '超时'),
        ('rate_limit', '限流'),
        ('api_error', 'API错误'),
        ('content_filter', '内容过滤'),
    ]

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages', verbose_name='会话')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, verbose_name='角色', db_index=True)
    content = models.TextField(verbose_name='消息内容')
    tokens_used = models.IntegerField(default=0, verbose_name='消耗Token数')
    is_ai_suggestion = models.BooleanField(default=False, verbose_name='是否AI生成的建议', db_index=True)
    is_adopted = models.BooleanField(default=False, verbose_name='是否已被客服采纳', db_index=True)
    ai_model = models.CharField(max_length=100, blank=True, verbose_name='使用的AI模型')
    prompt_version = models.CharField(max_length=50, blank=True, verbose_name='使用的提示词版本')
    error_type = models.CharField(max_length=50, blank=True, default='none', verbose_name='调用异常类型', db_index=True)
    error_message = models.TextField(blank=True, verbose_name='异常详情')
    suggested_reply = models.TextField(blank=True, verbose_name='AI建议的回复内容')
    review_status = models.CharField(max_length=20, choices=REVIEW_STATUS_CHOICES, default='pending', verbose_name='审核状态', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间', db_index=True)

    class Meta:
        db_table = 'messages'
        verbose_name = '消息'
        verbose_name_plural = verbose_name
        ordering = ['created_at']

    def __str__(self):
        return f'{self.role}: {self.content[:50]}'
