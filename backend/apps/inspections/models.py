from django.db import models
from apps.common import BaseModel


class InspectionTemplate(BaseModel):
    name = models.CharField(max_length=100, verbose_name='模板名称')
    code = models.CharField(max_length=50, blank=True, verbose_name='模板编码')
    description = models.TextField(blank=True, null=True, verbose_name='描述')
    cron_expression = models.CharField(max_length=100, blank=True, verbose_name='定时表达式')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    groups = models.ManyToManyField(
        'assets.AssetGroup',
        blank=True,
        related_name='inspection_templates',
        verbose_name='资产分组'
    )
    servers = models.ManyToManyField(
        'assets.ServerAsset',
        blank=True,
        related_name='inspection_templates',
        verbose_name='指定服务器'
    )

    class Meta:
        verbose_name = '巡检模板'
        verbose_name_plural = verbose_name
        unique_together = [('organization', 'name')]
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class InspectionItem(BaseModel):
    TYPE_CPU = 'cpu'
    TYPE_MEMORY = 'memory'
    TYPE_DISK = 'disk'
    TYPE_NETWORK = 'network'
    TYPE_SERVICE = 'service'
    TYPE_CUSTOM = 'custom'

    TYPE_CHOICES = [
        (TYPE_CPU, 'CPU使用率'),
        (TYPE_MEMORY, '内存使用率'),
        (TYPE_DISK, '磁盘使用率'),
        (TYPE_NETWORK, '网络连通性'),
        (TYPE_SERVICE, '服务状态'),
        (TYPE_CUSTOM, '自定义'),
    ]

    OPERATOR_GT = 'gt'
    OPERATOR_GTE = 'gte'
    OPERATOR_LT = 'lt'
    OPERATOR_LTE = 'lte'
    OPERATOR_EQ = 'eq'
    OPERATOR_NEQ = 'neq'
    OPERATOR_CONTAINS = 'contains'

    OPERATOR_CHOICES = [
        (OPERATOR_GT, '大于'),
        (OPERATOR_GTE, '大于等于'),
        (OPERATOR_LT, '小于'),
        (OPERATOR_LTE, '小于等于'),
        (OPERATOR_EQ, '等于'),
        (OPERATOR_NEQ, '不等于'),
        (OPERATOR_CONTAINS, '包含'),
    ]

    template = models.ForeignKey(
        InspectionTemplate,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='所属模板'
    )
    name = models.CharField(max_length=100, verbose_name='检查项名称')
    item_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_CUSTOM, verbose_name='检查类型')
    metric = models.CharField(max_length=100, blank=True, verbose_name='指标名称')
    operator = models.CharField(max_length=20, choices=OPERATOR_CHOICES, default=OPERATOR_GT, verbose_name='比较操作符')
    threshold = models.CharField(max_length=100, blank=True, verbose_name='阈值')
    warning_value = models.CharField(max_length=100, blank=True, verbose_name='告警值')
    critical_value = models.CharField(max_length=100, blank=True, verbose_name='严重值')
    description = models.TextField(blank=True, null=True, verbose_name='描述')
    sort_order = models.IntegerField(default=0, verbose_name='排序')

    class Meta:
        verbose_name = '巡检项'
        verbose_name_plural = verbose_name
        ordering = ['template', 'sort_order', 'id']

    def __str__(self):
        return f'{self.template.name} - {self.name}'


class InspectionTask(BaseModel):
    STATUS_PENDING = 'pending'
    STATUS_RUNNING = 'running'
    STATUS_SUCCESS = 'success'
    STATUS_FAILED = 'failed'
    STATUS_PARTIAL = 'partial'

    STATUS_CHOICES = [
        (STATUS_PENDING, '待执行'),
        (STATUS_RUNNING, '执行中'),
        (STATUS_SUCCESS, '全部正常'),
        (STATUS_FAILED, '执行失败'),
        (STATUS_PARTIAL, '部分异常'),
    ]

    TRIGGER_AUTO = 'auto'
    TRIGGER_MANUAL = 'manual'

    TRIGGER_CHOICES = [
        (TRIGGER_AUTO, '定时触发'),
        (TRIGGER_MANUAL, '手动触发'),
    ]

    template = models.ForeignKey(
        InspectionTemplate,
        on_delete=models.CASCADE,
        related_name='tasks',
        verbose_name='巡检模板'
    )
    code = models.CharField(max_length=50, unique=True, verbose_name='任务编号')
    name = models.CharField(max_length=200, verbose_name='任务名称')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, verbose_name='执行状态')
    trigger_type = models.CharField(max_length=20, choices=TRIGGER_CHOICES, default=TRIGGER_MANUAL, verbose_name='触发方式')
    started_at = models.DateTimeField(null=True, blank=True, verbose_name='开始时间')
    finished_at = models.DateTimeField(null=True, blank=True, verbose_name='结束时间')
    total_count = models.IntegerField(default=0, verbose_name='总检查项')
    success_count = models.IntegerField(default=0, verbose_name='正常数')
    warning_count = models.IntegerField(default=0, verbose_name='告警数')
    critical_count = models.IntegerField(default=0, verbose_name='严重数')
    failed_count = models.IntegerField(default=0, verbose_name='失败数')
    result_summary = models.TextField(blank=True, null=True, verbose_name='执行结果摘要')
    triggered_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='triggered_inspections',
        verbose_name='触发人'
    )

    class Meta:
        verbose_name = '巡检任务'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.code} - {self.name}'


class InspectionResult(BaseModel):
    task = models.ForeignKey(
        InspectionTask,
        on_delete=models.CASCADE,
        related_name='results',
        verbose_name='巡检任务'
    )
    item = models.ForeignKey(
        InspectionItem,
        on_delete=models.CASCADE,
        related_name='results',
        verbose_name='巡检项'
    )
    server = models.ForeignKey(
        'assets.ServerAsset',
        on_delete=models.CASCADE,
        related_name='inspection_results',
        verbose_name='服务器'
    )
    STATUS_SUCCESS = 'success'
    STATUS_WARNING = 'warning'
    STATUS_CRITICAL = 'critical'
    STATUS_FAILED = 'failed'

    STATUS_CHOICES = [
        (STATUS_SUCCESS, '正常'),
        (STATUS_WARNING, '告警'),
        (STATUS_CRITICAL, '严重'),
        (STATUS_FAILED, '失败'),
    ]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_SUCCESS, verbose_name='检查结果')
    actual_value = models.CharField(max_length=200, blank=True, verbose_name='实际值')
    expected_value = models.CharField(max_length=200, blank=True, verbose_name='期望值')
    message = models.TextField(blank=True, null=True, verbose_name='详细信息')
    checked_at = models.DateTimeField(auto_now_add=True, verbose_name='检查时间')

    class Meta:
        verbose_name = '巡检结果'
        verbose_name_plural = verbose_name
        ordering = ['-checked_at']

    def __str__(self):
        return f'{self.task.code} - {self.item.name}'
