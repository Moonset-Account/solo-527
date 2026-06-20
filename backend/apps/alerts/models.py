from django.db import models
from apps.common import BaseModel


class Alert(BaseModel):
    SOURCE_AUTO = 'auto'
    SOURCE_MANUAL = 'manual'
    SOURCE_INSPECTION = 'inspection'

    SOURCE_CHOICES = [
        (SOURCE_AUTO, '自动检测'),
        (SOURCE_MANUAL, '人工录入'),
        (SOURCE_INSPECTION, '巡检发现'),
    ]

    LEVEL_INFO = 'info'
    LEVEL_WARNING = 'warning'
    LEVEL_CRITICAL = 'critical'
    LEVEL_EMERGENCY = 'emergency'

    LEVEL_CHOICES = [
        (LEVEL_INFO, '提示'),
        (LEVEL_WARNING, '告警'),
        (LEVEL_CRITICAL, '严重'),
        (LEVEL_EMERGENCY, '紧急'),
    ]

    STATUS_PENDING = 'pending'
    STATUS_ACKNOWLEDGED = 'acknowledged'
    STATUS_PROCESSING = 'processing'
    STATUS_CLOSED = 'closed'

    STATUS_CHOICES = [
        (STATUS_PENDING, '待处理'),
        (STATUS_ACKNOWLEDGED, '已确认'),
        (STATUS_PROCESSING, '处理中'),
        (STATUS_CLOSED, '已关闭'),
    ]

    code = models.CharField(max_length=50, unique=True, verbose_name='告警编号')
    title = models.CharField(max_length=200, verbose_name='告警标题')
    content = models.TextField(verbose_name='告警内容')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default=SOURCE_AUTO, verbose_name='来源')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default=LEVEL_WARNING, verbose_name='告警级别')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, verbose_name='处理状态')
    server = models.ForeignKey(
        'assets.ServerAsset',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alerts',
        verbose_name='关联服务器'
    )
    change_window = models.ForeignKey(
        'changes.ChangeWindow',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alerts',
        verbose_name='关联变更窗口'
    )
    category = models.ForeignKey(
        'dictionaries.DictionaryItem',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alerts',
        verbose_name='告警分类'
    )
    metric = models.CharField(max_length=100, blank=True, verbose_name='监控指标')
    metric_value = models.CharField(max_length=100, blank=True, verbose_name='指标值')
    threshold = models.CharField(max_length=100, blank=True, verbose_name='阈值')
    occurred_at = models.DateTimeField(verbose_name='告警发生时间')
    acknowledged_at = models.DateTimeField(null=True, blank=True, verbose_name='确认时间')
    acknowledged_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='acknowledged_alerts',
        verbose_name='确认人'
    )
    processed_at = models.DateTimeField(null=True, blank=True, verbose_name='处理完成时间')
    processed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_alerts',
        verbose_name='处理人'
    )
    closed_at = models.DateTimeField(null=True, blank=True, verbose_name='关闭时间')
    closed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='closed_alerts',
        verbose_name='关闭人'
    )
    handler = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='handling_alerts',
        verbose_name='当前处理人'
    )
    solution = models.TextField(blank=True, null=True, verbose_name='解决方案')
    root_cause = models.TextField(blank=True, null=True, verbose_name='根本原因')
    review_summary = models.TextField(blank=True, null=True, verbose_name='复盘总结')

    class Meta:
        verbose_name = '告警记录'
        verbose_name_plural = verbose_name
        ordering = ['-occurred_at']

    def __str__(self):
        return f'{self.code} - {self.title}'


class AlertRecord(BaseModel):
    alert = models.ForeignKey(
        Alert,
        on_delete=models.CASCADE,
        related_name='records',
        verbose_name='所属告警'
    )
    action = models.CharField(max_length=50, verbose_name='操作动作')
    old_status = models.CharField(max_length=20, blank=True, verbose_name='原状态')
    new_status = models.CharField(max_length=20, blank=True, verbose_name='新状态')
    comment = models.TextField(blank=True, null=True, verbose_name='处理说明')
    processed_at = models.DateTimeField(auto_now_add=True, verbose_name='处理时间')
    processed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alert_records',
        verbose_name='处理人'
    )

    class Meta:
        verbose_name = '告警处理记录'
        verbose_name_plural = verbose_name
        ordering = ['-processed_at']

    def __str__(self):
        return f'{self.alert.code} - {self.action}'


class AlertAttachment(BaseModel):
    alert = models.ForeignKey(
        Alert,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name='所属告警'
    )
    file = models.FileField(upload_to='alert_attachments/%Y/%m/%d/', verbose_name='文件')
    file_name = models.CharField(max_length=200, verbose_name='文件名')
    file_size = models.BigIntegerField(default=0, verbose_name='文件大小(字节)')
    content_type = models.CharField(max_length=100, blank=True, verbose_name='文件类型')

    class Meta:
        verbose_name = '告警附件'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.file_name


class AlertHistory(BaseModel):
    alert = models.ForeignKey(
        Alert,
        on_delete=models.CASCADE,
        related_name='histories',
        verbose_name='所属告警'
    )
    field = models.CharField(max_length=100, verbose_name='字段名')
    old_value = models.TextField(blank=True, null=True, verbose_name='旧值')
    new_value = models.TextField(blank=True, null=True, verbose_name='新值')
    changed_at = models.DateTimeField(auto_now_add=True, verbose_name='修改时间')
    changed_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alert_histories',
        verbose_name='修改人'
    )

    class Meta:
        verbose_name = '告警修改历史'
        verbose_name_plural = verbose_name
        ordering = ['-changed_at']

    def __str__(self):
        return f'{self.alert.code} - {self.field}'
