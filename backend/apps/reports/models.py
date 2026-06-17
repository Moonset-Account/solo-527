from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from apps.core.models import BaseModel


class ReportTemplate(BaseModel):
    class ReportType(models.TextChoices):
        TICKET_SUMMARY = 'ticket_summary', _('工单汇总报表')
        TICKET_DETAIL = 'ticket_detail', _('工单明细报表')
        QUALITY_REPORT = 'quality_report', _('质检报表')
        AGENT_PERFORMANCE = 'agent_performance', _('客服绩效报表')
        KNOWLEDGE_USAGE = 'knowledge_usage', _('知识库使用报表')
        CUSTOM = 'custom', _('自定义报表')

    class Status(models.TextChoices):
        ACTIVE = 'active', _('启用')
        INACTIVE = 'inactive', _('禁用')

    name = models.CharField(max_length=200, verbose_name='报表名称')
    report_type = models.CharField(
        max_length=30,
        choices=ReportType.choices,
        default=ReportType.CUSTOM,
        verbose_name='报表类型'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name='状态'
    )
    description = models.TextField(blank=True, verbose_name='描述')
    config = models.JSONField(default=dict, blank=True, verbose_name='报表配置')
    columns = models.JSONField(default=list, blank=True, verbose_name='列配置')
    filters = models.JSONField(default=dict, blank=True, verbose_name='默认筛选条件')
    chart_config = models.JSONField(default=dict, blank=True, verbose_name='图表配置')

    class Meta:
        verbose_name = '报表模板'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class ReportSchedule(BaseModel):
    class Frequency(models.TextChoices):
        DAILY = 'daily', _('每日')
        WEEKLY = 'weekly', _('每周')
        MONTHLY = 'monthly', _('每月')
        QUARTERLY = 'quarterly', _('每季度')

    class Status(models.TextChoices):
        ACTIVE = 'active', _('启用')
        INACTIVE = 'inactive', _('禁用')

    template = models.ForeignKey(
        ReportTemplate,
        on_delete=models.CASCADE,
        related_name='schedules',
        verbose_name='报表模板'
    )
    name = models.CharField(max_length=200, verbose_name='调度名称')
    frequency = models.CharField(
        max_length=20,
        choices=Frequency.choices,
        default=Frequency.DAILY,
        verbose_name='执行频率'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name='状态'
    )
    run_time = models.TimeField(verbose_name='执行时间')
    day_of_week = models.IntegerField(null=True, blank=True, verbose_name='周几(0-6)')
    day_of_month = models.IntegerField(null=True, blank=True, verbose_name='几号(1-31)')
    recipients = models.JSONField(default=list, blank=True, verbose_name='接收人列表')
    filters = models.JSONField(default=dict, blank=True, verbose_name='筛选条件')
    last_run_at = models.DateTimeField(null=True, blank=True, verbose_name='上次运行时间')
    next_run_at = models.DateTimeField(null=True, blank=True, verbose_name='下次运行时间')

    class Meta:
        verbose_name = '报表调度'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class ReportInstance(BaseModel):
    class Status(models.TextChoices):
        PENDING = 'pending', _('待生成')
        GENERATING = 'generating', _('生成中')
        COMPLETED = 'completed', _('已完成')
        FAILED = 'failed', _('失败')

    template = models.ForeignKey(
        ReportTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='instances',
        verbose_name='报表模板'
    )
    schedule = models.ForeignKey(
        ReportSchedule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='instances',
        verbose_name='报表调度'
    )
    name = models.CharField(max_length=200, verbose_name='报表名称')
    report_type = models.CharField(max_length=30, verbose_name='报表类型')
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='状态'
    )
    parameters = models.JSONField(default=dict, blank=True, verbose_name='参数')
    filters = models.JSONField(default=dict, blank=True, verbose_name='筛选条件')
    summary_data = models.JSONField(default=dict, blank=True, verbose_name='汇总数据')
    chart_data = models.JSONField(default=dict, blank=True, verbose_name='图表数据')
    file_path = models.FileField(upload_to='reports/', null=True, blank=True, verbose_name='文件路径')
    file_size = models.IntegerField(null=True, blank=True, verbose_name='文件大小(字节)')
    record_count = models.IntegerField(null=True, blank=True, verbose_name='记录数')
    started_at = models.DateTimeField(null=True, blank=True, verbose_name='开始时间')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')
    error_message = models.TextField(blank=True, verbose_name='错误信息')
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name='过期时间')
    period_start = models.DateField(null=True, blank=True, verbose_name='统计开始日期')
    period_end = models.DateField(null=True, blank=True, verbose_name='统计结束日期')

    class Meta:
        verbose_name = '报表实例'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class DashboardWidget(BaseModel):
    class WidgetType(models.TextChoices):
        CARD = 'card', _('数值卡片')
        CHART_LINE = 'chart_line', _('折线图')
        CHART_BAR = 'chart_bar', _('柱状图')
        CHART_PIE = 'chart_pie', _('饼图')
        TABLE = 'table', _('数据表格')

    class Size(models.TextChoices):
        SMALL = 'small', _('小')
        MEDIUM = 'medium', _('中')
        LARGE = 'large', _('大')

    name = models.CharField(max_length=200, verbose_name='组件名称')
    widget_type = models.CharField(
        max_length=20,
        choices=WidgetType.choices,
        default=WidgetType.CARD,
        verbose_name='组件类型'
    )
    size = models.CharField(
        max_length=20,
        choices=Size.choices,
        default=Size.MEDIUM,
        verbose_name='尺寸'
    )
    data_source = models.CharField(max_length=200, verbose_name='数据源')
    config = models.JSONField(default=dict, blank=True, verbose_name='组件配置')
    position = models.IntegerField(default=0, verbose_name='排序位置')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    refresh_interval = models.IntegerField(default=300, verbose_name='刷新间隔(秒)')

    class Meta:
        verbose_name = '仪表盘组件'
        verbose_name_plural = verbose_name
        ordering = ['position']

    def __str__(self):
        return self.name
