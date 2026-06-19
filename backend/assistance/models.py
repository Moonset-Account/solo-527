from django.db import models
from django.conf import settings
from django.utils import timezone
from common.models import BaseModel, ProcessRecord
from common.managers import ProductionDataManager, TestDataManager
from residents.models import Resident


class AssistanceDemand(BaseModel):
    TYPE_CHOICES = (
        ('elderly_care', '老人照料'),
        ('child_care', '儿童看护'),
        ('medical', '医疗帮扶'),
        ('housework', '家务帮忙'),
        ('shopping', '代购代办'),
        ('emotional', '心理疏导'),
        ('repair', '维修服务'),
        ('legal', '法律咨询'),
        ('education', '教育辅导'),
        ('employment', '就业帮扶'),
        ('financial', '经济救助'),
        ('other', '其他'),
    )

    STATUS_CHOICES = (
        ('pending', '待处理'),
        ('assigned', '已指派'),
        ('in_progress', '处理中'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
        ('rejected', '已拒绝'),
    )

    PRIORITY_CHOICES = (
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
        ('urgent', '紧急'),
    )

    title = models.CharField(max_length=200, verbose_name='需求标题')
    description = models.TextField(verbose_name='需求描述')
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, verbose_name='需求类型')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium', verbose_name='优先级')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    resident = models.ForeignKey(
        Resident,
        on_delete=models.CASCADE,
        related_name='assistance_demands',
        verbose_name='申请人'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_assistance',
        verbose_name='帮扶人'
    )
    contact_phone = models.CharField(max_length=20, verbose_name='联系电话')
    contact_address = models.CharField(max_length=255, blank=True, verbose_name='联系地址')
    preferred_time = models.CharField(max_length=200, blank=True, verbose_name='期望时间')
    estimated_duration = models.IntegerField(null=True, blank=True, verbose_name='预计时长（分钟）')
    start_time = models.DateTimeField(null=True, blank=True, verbose_name='开始时间')
    end_time = models.DateTimeField(null=True, blank=True, verbose_name='结束时间')
    actual_start_time = models.DateTimeField(null=True, blank=True, verbose_name='实际开始时间')
    actual_end_time = models.DateTimeField(null=True, blank=True, verbose_name='实际结束时间')
    community = models.CharField(max_length=100, blank=True, verbose_name='所属社区')
    household_type = models.CharField(max_length=50, blank=True, verbose_name='家庭类型')
    special_requirements = models.TextField(blank=True, verbose_name='特殊要求')

    objects = ProductionDataManager()
    test_objects = TestDataManager()

    class Meta:
        verbose_name = '帮扶需求'
        verbose_name_plural = verbose_name
        ordering = ['-priority', '-created_at']

    def __str__(self):
        return f'{self.title} - {self.resident.user.get_full_name()} - {self.get_status_display()}'

    def assign(self, volunteer, user):
        self.assigned_to = volunteer
        self.status = 'assigned'
        self.save()

        AssistanceProcessRecord.objects.create(
            assistance=self,
            content=f'已指派给志愿者 {volunteer.get_full_name()}',
            processed_by=user,
            status_change='assigned'
        )

        AssistanceProgress.objects.create(
            assistance=self,
            resident=self.resident,
            content=f'需求已受理，已指派志愿者 {volunteer.get_full_name()}',
            status='in_progress',
            processed_by=user
        )

    def start(self, user):
        self.status = 'in_progress'
        self.actual_start_time = timezone.now()
        self.save()

        AssistanceProcessRecord.objects.create(
            assistance=self,
            content='帮扶开始',
            processed_by=user,
            status_change='in_progress'
        )

        AssistanceProgress.objects.create(
            assistance=self,
            resident=self.resident,
            content='帮扶工作已开始',
            status='in_progress',
            processed_by=user
        )

    def complete(self, user, result='', satisfaction=None):
        self.status = 'completed'
        self.actual_end_time = timezone.now()
        self.save()

        AssistanceProcessRecord.objects.create(
            assistance=self,
            content=f'帮扶已完成，结果：{result}',
            processed_by=user,
            status_change='completed'
        )

        AssistanceProgress.objects.create(
            assistance=self,
            resident=self.resident,
            content=f'帮扶已完成，结果：{result}',
            status='completed',
            processed_by=user,
            satisfaction=satisfaction
        )


class AssistanceProgress(ProcessRecord):
    assistance = models.ForeignKey(
        AssistanceDemand,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='progress_records',
        verbose_name='帮扶需求'
    )
    resident = models.ForeignKey(
        Resident,
        on_delete=models.CASCADE,
        related_name='assistance_progress',
        verbose_name='居民'
    )
    status = models.CharField(
        max_length=20,
        choices=AssistanceDemand.STATUS_CHOICES,
        default='in_progress',
        verbose_name='状态'
    )
    satisfaction = models.IntegerField(
        null=True,
        blank=True,
        choices=[(i, str(i)) for i in range(1, 6)],
        verbose_name='满意度'
    )

    class Meta:
        verbose_name = '帮扶进度'
        verbose_name_plural = verbose_name
        ordering = ['-processed_at']


class AssistanceProcessRecord(ProcessRecord):
    assistance = models.ForeignKey(
        AssistanceDemand,
        on_delete=models.CASCADE,
        related_name='process_records',
        verbose_name='帮扶需求'
    )
    status_change = models.CharField(max_length=20, choices=AssistanceDemand.STATUS_CHOICES, blank=True, verbose_name='状态变更')

    class Meta:
        verbose_name = '帮扶处理记录'
        verbose_name_plural = verbose_name
