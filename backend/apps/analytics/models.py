from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class UsageStats(models.Model):
    date = models.DateField(verbose_name='日期', db_index=True)
    total_conversations = models.IntegerField(default=0, verbose_name='总会话数')
    total_messages = models.IntegerField(default=0, verbose_name='总消息数')
    total_tokens = models.BigIntegerField(default=0, verbose_name='总Token数')
    active_users = models.IntegerField(default=0, verbose_name='活跃用户数')
    new_users = models.IntegerField(default=0, verbose_name='新增用户数')
    api_calls = models.IntegerField(default=0, verbose_name='API调用次数')
    avg_response_time = models.FloatField(default=0.0, verbose_name='平均响应时间(秒)')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'usage_stats'
        verbose_name = '使用统计'
        verbose_name_plural = verbose_name
        unique_together = ['date']
        ordering = ['-date']

    def __str__(self):
        return f'{self.date} 使用统计'


class TokenUsage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='token_usage', verbose_name='用户')
    date = models.DateField(verbose_name='日期', db_index=True)
    model = models.CharField(max_length=100, verbose_name='模型名称', db_index=True)
    prompt_tokens = models.IntegerField(default=0, verbose_name='提示Token数')
    completion_tokens = models.IntegerField(default=0, verbose_name='补全Token数')
    total_tokens = models.IntegerField(default=0, verbose_name='总Token数')
    cost = models.DecimalField(max_digits=10, decimal_places=6, default=0.0, verbose_name='费用')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'token_usage'
        verbose_name = 'Token使用记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} - {self.date} - {self.model}'


class UserActivity(models.Model):
    ACTIVITY_TYPE_CHOICES = [
        ('login', '登录'),
        ('logout', '登出'),
        ('create_conversation', '创建会话'),
        ('send_message', '发送消息'),
        ('create_prompt', '创建提示词'),
        ('review_content', '审核内容'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities', verbose_name='用户')
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPE_CHOICES, verbose_name='活动类型', db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='IP地址')
    user_agent = models.TextField(blank=True, verbose_name='用户代理')
    metadata = models.JSONField(default=dict, blank=True, verbose_name='元数据')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间', db_index=True)

    class Meta:
        db_table = 'user_activities'
        verbose_name = '用户活动'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} - {self.get_activity_type_display()}'


class AccuracyStats(models.Model):
    date = models.DateField(verbose_name='日期', db_index=True)
    sales_operation = models.CharField(max_length=50, verbose_name='销售运营分组', db_index=True)
    prompt_version = models.CharField(max_length=50, verbose_name='提示词版本', db_index=True)
    total_calls = models.IntegerField(default=0, verbose_name='总调用次数')
    accurate_calls = models.IntegerField(default=0, verbose_name='准确次数')
    accuracy_rate = models.FloatField(default=0, verbose_name='准确率')
    error_timeout = models.IntegerField(default=0, verbose_name='超时错误数')
    error_rate_limit = models.IntegerField(default=0, verbose_name='限流错误数')
    error_api_error = models.IntegerField(default=0, verbose_name='API错误数')
    error_content_filter = models.IntegerField(default=0, verbose_name='内容过滤错误数')
    error_other = models.IntegerField(default=0, verbose_name='其他错误数')
    avg_response_time = models.FloatField(default=0, verbose_name='平均响应时间(秒)')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'accuracy_stats'
        verbose_name = '准确率统计'
        verbose_name_plural = verbose_name
        unique_together = ['date', 'sales_operation', 'prompt_version']
        ordering = ['-date']

    def __str__(self):
        return f'{self.date} - {self.sales_operation} - {self.prompt_version}'


class DailyStats(models.Model):
    date = models.DateField(verbose_name='日期', db_index=True, unique=True)
    total_conversations = models.IntegerField(default=0, verbose_name='总会话数')
    total_messages = models.IntegerField(default=0, verbose_name='总消息数')
    ai_suggestion_count = models.IntegerField(default=0, verbose_name='AI建议数')
    ai_adoption_count = models.IntegerField(default=0, verbose_name='AI采纳数')
    ai_adoption_rate = models.FloatField(default=0, verbose_name='AI采纳率')
    total_reviews = models.IntegerField(default=0, verbose_name='总审核数')
    approved_reviews = models.IntegerField(default=0, verbose_name='通过审核数')
    rejected_reviews = models.IntegerField(default=0, verbose_name='拒绝审核数')
    pending_reviews = models.IntegerField(default=0, verbose_name='待审核数')
    total_risks = models.IntegerField(default=0, verbose_name='总风险数')
    resolved_risks = models.IntegerField(default=0, verbose_name='已解决风险数')
    avg_response_time = models.FloatField(default=0, verbose_name='平均响应时间(秒)')
    total_tokens = models.BigIntegerField(default=0, verbose_name='总Token数')
    total_cost = models.DecimalField(max_digits=12, decimal_places=6, default=0.0, verbose_name='总费用')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'daily_stats'
        verbose_name = '日统计'
        verbose_name_plural = verbose_name
        ordering = ['-date']

    def __str__(self):
        return f'{self.date} 日统计'
