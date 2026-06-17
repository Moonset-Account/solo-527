from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.core.models import BaseModel


class KnowledgeItem(BaseModel):
    class Status(models.TextChoices):
        DRAFT = 'draft', _('草稿')
        PUBLISHED = 'published', _('已发布')
        ARCHIVED = 'archived', _('已归档')

    class Category(models.TextChoices):
        PRODUCT = 'product', _('产品知识')
        SERVICE = 'service', _('服务流程')
        FAQ = 'faq', _('常见问题')
        TROUBLESHOOTING = 'troubleshooting', _('故障排除')
        POLICY = 'policy', _('政策法规')
        OTHER = 'other', _('其他')

    title = models.CharField(max_length=200, verbose_name='标题')
    content = models.TextField(verbose_name='内容')
    summary = models.CharField(max_length=500, blank=True, verbose_name='摘要')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        verbose_name='状态'
    )
    category = models.CharField(
        max_length=30,
        choices=Category.choices,
        default=Category.OTHER,
        verbose_name='分类'
    )
    keywords = models.CharField(max_length=500, blank=True, verbose_name='关键词')
    view_count = models.IntegerField(default=0, verbose_name='浏览次数')
    helpful_count = models.IntegerField(default=0, verbose_name='有用次数')
    not_helpful_count = models.IntegerField(default=0, verbose_name='无用次数')
    hit_count = models.IntegerField(default=0, verbose_name='命中次数')
    is_tutorial = models.BooleanField(default=False, verbose_name='是否为教程')
    published_at = models.DateTimeField(null=True, blank=True, verbose_name='发布时间')
    tags = models.JSONField(default=list, blank=True, verbose_name='标签')
    related_items = models.ManyToManyField(
        'self',
        blank=True,
        symmetrical=False,
        related_name='related_to',
        verbose_name='相关条目'
    )

    class Meta:
        verbose_name = '知识库条目'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['category']),
            models.Index(fields=['is_tutorial']),
            models.Index(fields=['created_at']),
            models.Index(fields=['view_count']),
            models.Index(fields=['hit_count']),
        ]

    def __str__(self):
        return self.title


class KnowledgeQuery(BaseModel):
    query_text = models.CharField(max_length=500, verbose_name='查询内容')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='knowledge_queries',
        verbose_name='查询用户'
    )
    matched_item = models.ForeignKey(
        KnowledgeItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='queries',
        verbose_name='匹配条目'
    )
    match_score = models.FloatField(null=True, blank=True, verbose_name='匹配度')
    is_helpful = models.BooleanField(null=True, blank=True, verbose_name='是否有用')
    has_reminder = models.BooleanField(default=False, verbose_name='是否设置提醒')
    source = models.CharField(max_length=50, blank=True, verbose_name='来源')
    user_agent = models.CharField(max_length=500, blank=True, verbose_name='用户代理')
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='IP地址')

    class Meta:
        verbose_name = '知识查询记录'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['matched_item']),
            models.Index(fields=['created_at']),
            models.Index(fields=['has_reminder']),
        ]

    def __str__(self):
        return self.query_text[:50]
