from django.db import models
from apps.common import BaseModel


class ChangeWindow(BaseModel):
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_SUCCESS = 'success'
    STATUS_FAILED = 'failed'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_PENDING, '待审批'),
        (STATUS_APPROVED, '已批准'),
        (STATUS_IN_PROGRESS, '进行中'),
        (STATUS_SUCCESS, '成功'),
        (STATUS_FAILED, '失败'),
        (STATUS_CANCELLED, '已取消'),
    ]

    TYPE_ROUTINE = 'routine'
    TYPE_EMERGENCY = 'emergency'
    TYPE_PLANNED = 'planned'

    TYPE_CHOICES = [
        (TYPE_ROUTINE, '日常变更'),
        (TYPE_EMERGENCY, '紧急变更'),
        (TYPE_PLANNED, '计划变更'),
    ]

    code = models.CharField(max_length=50, unique=True, verbose_name='变更编号')
    name = models.CharField(max_length=200, verbose_name='变更名称')
    change_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_PLANNED, verbose_name='变更类型')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, verbose_name='变更状态')
    description = models.TextField(verbose_name='变更描述')
    plan_content = models.TextField(blank=True, null=True, verbose_name='变更方案')
    rollback_plan = models.TextField(blank=True, null=True, verbose_name='回滚方案')
    risk_assessment = models.TextField(blank=True, null=True, verbose_name='风险评估')
    start_time = models.DateTimeField(verbose_name='计划开始时间')
    end_time = models.DateTimeField(verbose_name='计划结束时间')
    actual_start = models.DateTimeField(null=True, blank=True, verbose_name='实际开始时间')
    actual_end = models.DateTimeField(null=True, blank=True, verbose_name='实际结束时间')
    applicant = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='applied_changes',
        verbose_name='申请人'
    )
    approver = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_changes',
        verbose_name='审批人'
    )
    executor = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='executed_changes',
        verbose_name='执行人'
    )
    approved_at = models.DateTimeField(null=True, blank=True, verbose_name='审批时间')
    result_summary = models.TextField(blank=True, null=True, verbose_name='变更结果')
    servers = models.ManyToManyField(
        'assets.ServerAsset',
        blank=True,
        related_name='change_windows',
        verbose_name='涉及服务器'
    )

    class Meta:
        verbose_name = '变更窗口'
        verbose_name_plural = verbose_name
        ordering = ['-start_time']

    def __str__(self):
        return f'{self.code} - {self.name}'


class ChangeLog(BaseModel):
    change_window = models.ForeignKey(
        ChangeWindow,
        on_delete=models.CASCADE,
        related_name='logs',
        verbose_name='变更窗口'
    )
    action = models.CharField(max_length=50, verbose_name='动作')
    old_status = models.CharField(max_length=20, blank=True, verbose_name='原状态')
    new_status = models.CharField(max_length=20, blank=True, verbose_name='新状态')
    detail = models.TextField(blank=True, null=True, verbose_name='详情')
    is_failure = models.BooleanField(default=False, verbose_name='是否失败操作')
    failure_reason = models.TextField(blank=True, null=True, verbose_name='失败原因')
    operator = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='change_logs',
        verbose_name='操作人'
    )
    operated_at = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')

    class Meta:
        verbose_name = '变更日志'
        verbose_name_plural = verbose_name
        ordering = ['-operated_at']

    def __str__(self):
        return f'{self.change_window.code} - {self.action}'
