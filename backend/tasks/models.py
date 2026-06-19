from django.db import models
from django.conf import settings
from django.utils import timezone
from common.models import BaseModel, ProcessRecord
from common.managers import ProductionDataManager, TestDataManager


class Task(BaseModel):
    TYPE_CHOICES = (
        ('voting', '投票相关'),
        ('patrol', '巡逻相关'),
        ('assistance', '帮扶相关'),
        ('resident', '居民管理'),
        ('topic', '议题相关'),
        ('qualification_exception', '资格异常'),
        ('reminder', '提醒任务'),
        ('issue', '问题处理'),
        ('other', '其他'),
    )

    STATUS_CHOICES = (
        ('pending', '待处理'),
        ('in_progress', '处理中'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
    )

    PRIORITY_CHOICES = (
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
        ('urgent', '紧急'),
    )

    title = models.CharField(max_length=200, verbose_name='任务标题')
    description = models.TextField(verbose_name='任务描述')
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, verbose_name='任务类型')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium', verbose_name='优先级')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks',
        verbose_name='负责人'
    )
    deadline = models.DateTimeField(null=True, blank=True, verbose_name='截止时间')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')
    community = models.CharField(max_length=100, blank=True, verbose_name='所属社区')
    source = models.CharField(max_length=50, blank=True, verbose_name='来源')
    source_id = models.IntegerField(null=True, blank=True, verbose_name='来源ID')
    related_resident = models.ForeignKey(
        'residents.Resident',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='related_tasks',
        verbose_name='关联居民'
    )

    objects = ProductionDataManager()
    test_objects = TestDataManager()

    class Meta:
        verbose_name = '任务'
        verbose_name_plural = verbose_name
        ordering = ['-priority', '-created_at']

    def __str__(self):
        return f'{self.title} - {self.get_status_display()}'

    def start(self, user):
        self.status = 'in_progress'
        self.assigned_to = user
        self.save()

        TaskProcessRecord.objects.create(
            task=self,
            content='任务开始处理',
            processed_by=user,
            status_change='in_progress'
        )

    def complete(self, user, remark=''):
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.save()

        TaskProcessRecord.objects.create(
            task=self,
            content=f'任务已完成，{remark}',
            processed_by=user,
            status_change='completed'
        )

        if self.type == 'qualification_exception' and self.related_resident:
            from assistance.models import AssistanceProgress
            AssistanceProgress.objects.create(
                assistance=None,
                resident=self.related_resident,
                content=f'投票资格异常已处理：{self.title} - {remark}',
                status='completed',
                processed_by=user
            )


class TaskProcessRecord(ProcessRecord):
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='process_records',
        verbose_name='任务'
    )
    status_change = models.CharField(max_length=20, choices=Task.STATUS_CHOICES, blank=True, verbose_name='状态变更')

    class Meta:
        verbose_name = '任务处理记录'
        verbose_name_plural = verbose_name
