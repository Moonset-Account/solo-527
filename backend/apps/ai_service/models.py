from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class AIModel(models.Model):
    PROVIDER_CHOICES = [
        ('openai', 'OpenAI'),
        ('anthropic', 'Anthropic'),
        ('google', 'Google'),
        ('local', '本地模型'),
        ('other', '其他'),
    ]

    name = models.CharField(max_length=100, verbose_name='模型名称')
    provider = models.CharField(max_length=50, choices=PROVIDER_CHOICES, verbose_name='提供商')
    model_id = models.CharField(max_length=255, verbose_name='模型ID')
    description = models.TextField(blank=True, verbose_name='描述')
    max_tokens = models.IntegerField(default=4096, verbose_name='最大Token数')
    input_price = models.DecimalField(max_digits=10, decimal_places=6, default=0.0, verbose_name='输入价格/千Token')
    output_price = models.DecimalField(max_digits=10, decimal_places=6, default=0.0, verbose_name='输出价格/千Token')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    supports_streaming = models.BooleanField(default=True, verbose_name='支持流式输出')
    capabilities = models.JSONField(default=list, blank=True, verbose_name='能力列表')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'ai_models'
        verbose_name = 'AI模型'
        verbose_name_plural = verbose_name
        ordering = ['provider', 'name']

    def __str__(self):
        return f'{self.get_provider_display()} - {self.name}'


class APIConfig(models.Model):
    provider = models.CharField(max_length=50, verbose_name='提供商')
    api_key = models.CharField(max_length=500, verbose_name='API密钥')
    base_url = models.URLField(blank=True, verbose_name='API基础URL')
    is_default = models.BooleanField(default=False, verbose_name='是否默认')
    rate_limit_per_minute = models.IntegerField(default=60, verbose_name='每分钟请求限制')
    rate_limit_per_day = models.IntegerField(default=10000, verbose_name='每日请求限制')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'api_configs'
        verbose_name = 'API配置'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.provider} API配置'


class AILog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ai_logs', verbose_name='用户')
    model = models.ForeignKey(AIModel, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs', verbose_name='使用模型')
    prompt = models.TextField(verbose_name='输入内容')
    response = models.TextField(verbose_name='输出内容')
    prompt_tokens = models.IntegerField(default=0, verbose_name='提示Token数')
    completion_tokens = models.IntegerField(default=0, verbose_name='补全Token数')
    total_tokens = models.IntegerField(default=0, verbose_name='总Token数')
    cost = models.DecimalField(max_digits=10, decimal_places=6, default=0.0, verbose_name='费用')
    latency = models.FloatField(default=0.0, verbose_name='响应时间(秒)')
    status = models.CharField(max_length=20, default='success', verbose_name='状态')
    error_message = models.TextField(blank=True, verbose_name='错误信息')
    request_id = models.CharField(max_length=100, blank=True, verbose_name='请求ID')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'ai_logs'
        verbose_name = 'AI调用日志'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.model} - {self.status} - {self.created_at}'
