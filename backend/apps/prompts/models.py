from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class PromptCategory(models.Model):
    name = models.CharField(max_length=100, verbose_name='分类名称')
    description = models.TextField(blank=True, verbose_name='分类描述')
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children', verbose_name='父分类')
    sort_order = models.IntegerField(default=0, verbose_name='排序')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        db_table = 'prompt_categories'
        verbose_name = '提示词分类'
        verbose_name_plural = verbose_name
        ordering = ['sort_order', 'id']

    def __str__(self):
        return self.name


class Prompt(models.Model):
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('enabled', '启用'),
        ('disabled', '停用'),
    ]

    title = models.CharField(max_length=255, verbose_name='标题')
    content = models.TextField(verbose_name='提示词内容')
    description = models.TextField(blank=True, verbose_name='描述')
    category = models.ForeignKey(PromptCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='prompts', verbose_name='分类')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='prompts', verbose_name='作者')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='状态', db_index=True)
    version = models.CharField(max_length=50, verbose_name='版本号', db_index=True)
    parent_prompt = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='child_versions', verbose_name='父版本')
    is_current_version = models.BooleanField(default=False, verbose_name='是否为当前版本', db_index=True)
    gray_scale_percent = models.IntegerField(default=100, verbose_name='灰度百分比')
    target_sales_operations = models.JSONField(default=list, blank=True, verbose_name='适用的销售运营分组')
    accuracy_rate = models.FloatField(default=0, verbose_name='准确率')
    usage_count = models.IntegerField(default=0, verbose_name='使用次数')
    variables = models.JSONField(default=dict, blank=True, verbose_name='变量定义')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间', db_index=True)
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'prompts'
        verbose_name = '提示词'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} (v{self.version})'


class PromptTemplate(models.Model):
    name = models.CharField(max_length=255, verbose_name='模板名称')
    template = models.TextField(verbose_name='模板内容')
    placeholders = models.JSONField(default=list, blank=True, verbose_name='占位符列表')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'prompt_templates'
        verbose_name = '提示词模板'
        verbose_name_plural = verbose_name

    def __str__(self):
        return self.name
