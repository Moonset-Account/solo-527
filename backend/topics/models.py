from django.db import models
from django.conf import settings
from django.utils import timezone
from common.models import BaseModel, ProcessRecord
from common.managers import ProductionDataManager, TestDataManager


class Topic(BaseModel):
    STATUS_CHOICES = (
        ('draft', '草稿'),
        ('pending', '待审核'),
        ('approved', '已通过'),
        ('rejected', '已驳回'),
        ('voting', '投票中'),
        ('completed', '已完成'),
        ('archived', '已归档'),
    )

    PRIORITY_CHOICES = (
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
        ('urgent', '紧急'),
    )

    CATEGORY_CHOICES = (
        ('infrastructure', '基础设施'),
        ('environment', '环境卫生'),
        ('security', '社区安全'),
        ('culture', '文化活动'),
        ('welfare', '民生福利'),
        ('management', '物业管理'),
        ('other', '其他'),
    )

    title = models.CharField(max_length=200, verbose_name='议题标题')
    description = models.TextField(verbose_name='议题描述')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, verbose_name='议题分类')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium', verbose_name='优先级')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name='状态')
    proposed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='proposed_topics',
        verbose_name='提案人'
    )
    representative = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_topics',
        verbose_name='负责代表'
    )
    community = models.CharField(max_length=100, blank=True, verbose_name='涉及社区')
    deadline = models.DateTimeField(null=True, blank=True, verbose_name='截止日期')
    voting_start_time = models.DateTimeField(null=True, blank=True, verbose_name='投票开始时间')
    voting_end_time = models.DateTimeField(null=True, blank=True, verbose_name='投票结束时间')
    estimated_budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='预估预算')
    attachments = models.FileField(upload_to='topic_attachments/', null=True, blank=True, verbose_name='附件')
    background = models.TextField(blank=True, verbose_name='议题背景')
    proposed_solution = models.TextField(blank=True, verbose_name='建议方案')
    expected_outcome = models.TextField(blank=True, verbose_name='预期效果')

    objects = ProductionDataManager()
    test_objects = TestDataManager()

    class Meta:
        verbose_name = '居民议题'
        verbose_name_plural = verbose_name
        ordering = ['-priority', '-created_at']

    def __str__(self):
        return f'{self.title} - {self.get_status_display()}'

    @property
    def is_voting_active(self):
        now = timezone.now()
        return (
            self.status == 'voting' and
            self.voting_start_time and
            self.voting_end_time and
            self.voting_start_time <= now <= self.voting_end_time
        )

    @property
    def total_votes(self):
        return self.votes.count()

    @property
    def yes_votes(self):
        return self.votes.filter(vote='yes').count()

    @property
    def no_votes(self):
        return self.votes.filter(vote='no').count()

    @property
    def abstain_votes(self):
        return self.votes.filter(vote='abstain').count()

    @property
    def voting_result(self):
        if self.total_votes == 0:
            return 'pending'
        yes_rate = self.yes_votes / self.total_votes
        if yes_rate >= 0.5:
            return 'passed'
        return 'rejected'


class TopicProcessRecord(ProcessRecord):
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name='process_records',
        verbose_name='议题'
    )
    status_change = models.CharField(max_length=20, choices=Topic.STATUS_CHOICES, blank=True, verbose_name='状态变更')

    class Meta:
        verbose_name = '议题处理记录'
        verbose_name_plural = verbose_name


class TopicComment(BaseModel):
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='议题'
    )
    content = models.TextField(verbose_name='评论内容')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='topic_comments',
        verbose_name='评论人'
    )
    is_anonymous = models.BooleanField(default=False, verbose_name='是否匿名')

    class Meta:
        verbose_name = '议题评论'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.author.get_full_name()} 评论了 {self.topic.title}'
