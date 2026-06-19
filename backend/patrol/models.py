from django.db import models
from django.conf import settings
from django.utils import timezone
from common.models import BaseModel, ProcessRecord
from common.managers import ProductionDataManager, TestDataManager


class PatrolRoute(BaseModel):
    name = models.CharField(max_length=100, verbose_name='路线名称')
    description = models.TextField(blank=True, verbose_name='路线描述')
    community = models.CharField(max_length=100, blank=True, verbose_name='所属社区')
    start_point = models.CharField(max_length=200, verbose_name='起点')
    end_point = models.CharField(max_length=200, verbose_name='终点')
    waypoints = models.TextField(blank=True, verbose_name='途经点（JSON格式）')
    estimated_duration = models.IntegerField(default=60, verbose_name='预计时长（分钟）')
    distance = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, verbose_name='距离（公里）')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')

    objects = ProductionDataManager()
    test_objects = TestDataManager()

    class Meta:
        verbose_name = '巡逻路线'
        verbose_name_plural = verbose_name
        ordering = ['name']

    def __str__(self):
        return self.name


class PatrolTask(BaseModel):
    STATUS_CHOICES = (
        ('pending', '待派发'),
        ('assigned', '已派发'),
        ('in_progress', '进行中'),
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
    route = models.ForeignKey(
        PatrolRoute,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks',
        verbose_name='巡逻路线'
    )
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium', verbose_name='优先级')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='patrol_tasks',
        verbose_name='执行人'
    )
    scheduled_start_time = models.DateTimeField(null=True, blank=True, verbose_name='计划开始时间')
    scheduled_end_time = models.DateTimeField(null=True, blank=True, verbose_name='计划结束时间')
    actual_start_time = models.DateTimeField(null=True, blank=True, verbose_name='实际开始时间')
    actual_end_time = models.DateTimeField(null=True, blank=True, verbose_name='实际结束时间')
    community = models.CharField(max_length=100, blank=True, verbose_name='所属社区')
    checkpoints = models.TextField(blank=True, verbose_name='检查点（JSON格式）')
    requirements = models.TextField(blank=True, verbose_name='任务要求')

    objects = ProductionDataManager()
    test_objects = TestDataManager()

    class Meta:
        verbose_name = '巡逻任务'
        verbose_name_plural = verbose_name
        ordering = ['-priority', '-scheduled_start_time']

    def __str__(self):
        return f'{self.title} - {self.get_status_display()}'

    def start(self, user):
        self.status = 'in_progress'
        self.actual_start_time = timezone.now()
        self.assigned_to = user
        self.save()

        PatrolProcessRecord.objects.create(
            task=self,
            content='任务开始执行',
            processed_by=user
        )

    def complete(self, user, remark=''):
        self.status = 'completed'
        self.actual_end_time = timezone.now()
        self.save()

        PatrolProcessRecord.objects.create(
            task=self,
            content='任务已完成',
            processed_by=user,
            remark=remark
        )


class PatrolCheckIn(BaseModel):
    task = models.ForeignKey(
        PatrolTask,
        on_delete=models.CASCADE,
        related_name='check_ins',
        verbose_name='巡逻任务'
    )
    volunteer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='patrol_check_ins',
        verbose_name='志愿者'
    )
    checkpoint_name = models.CharField(max_length=100, verbose_name='检查点名称')
    location = models.CharField(max_length=200, verbose_name='位置')
    latitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True, verbose_name='纬度')
    longitude = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True, verbose_name='经度')
    check_in_time = models.DateTimeField(default=timezone.now, verbose_name='签到时间')
    photo = models.ImageField(upload_to='patrol_photos/', null=True, blank=True, verbose_name='现场照片')
    remark = models.TextField(blank=True, verbose_name='备注')
    has_issue = models.BooleanField(default=False, verbose_name='是否发现问题')
    issue_description = models.TextField(blank=True, verbose_name='问题描述')

    class Meta:
        verbose_name = '巡逻签到'
        verbose_name_plural = verbose_name
        ordering = ['-check_in_time']

    def __str__(self):
        return f'{self.volunteer.get_full_name()} 在 {self.checkpoint_name} 签到'


class PatrolProcessRecord(ProcessRecord):
    task = models.ForeignKey(
        PatrolTask,
        on_delete=models.CASCADE,
        related_name='process_records',
        verbose_name='巡逻任务'
    )
    status_change = models.CharField(max_length=20, choices=PatrolTask.STATUS_CHOICES, blank=True, verbose_name='状态变更')

    class Meta:
        verbose_name = '巡逻任务处理记录'
        verbose_name_plural = verbose_name
