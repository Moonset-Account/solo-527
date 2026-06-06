from django.db import models
from django.contrib.auth.models import User
from core.models import TimeStampedModel

class ImportTask(TimeStampedModel):
    STATUS_CHOICES = (
        ('pending', '待处理'),
        ('processing', '处理中'),
        ('completed', '已完成'),
        ('failed', '失败'),
    )
    DATA_TYPE_CHOICES = (
        ('inventory', '进货数据'),
        ('material_use', '领用数据'),
        ('wastage', '报损数据'),
        ('stocktake', '盘点数据'),
        ('sale', '销售数据'),
        ('staff_shift', '班次数据'),
    )
    task_id = models.CharField(max_length=100, unique=True, verbose_name='任务ID')
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='上传用户')
    file_name = models.CharField(max_length=255, verbose_name='文件名')
    data_type = models.CharField(max_length=50, choices=DATA_TYPE_CHOICES, verbose_name='数据类型')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    total_rows = models.IntegerField(default=0, verbose_name='总行数')
    success_rows = models.IntegerField(default=0, verbose_name='成功行数')
    failed_rows = models.IntegerField(default=0, verbose_name='失败行数')
    error_log = models.TextField(blank=True, verbose_name='错误日志')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')

    class Meta:
        verbose_name = '数据导入任务'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.task_id} - {self.get_data_type_display()}'

class ReportTask(TimeStampedModel):
    STATUS_CHOICES = (
        ('pending', '待生成'),
        ('processing', '生成中'),
        ('completed', '已完成'),
        ('failed', '失败'),
    )
    REPORT_TYPE_CHOICES = (
        ('loss_summary', '损耗汇总报表'),
        ('loss_detail', '损耗明细报表'),
        ('store_ranking', '门店排行报表'),
        ('material_analysis', '原料分析报表'),
    )
    task_id = models.CharField(max_length=100, unique=True, verbose_name='任务ID')
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='生成用户')
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE_CHOICES, verbose_name='报表类型')
    filters = models.JSONField(default=dict, verbose_name='筛选条件')
    exclude_trial = models.BooleanField(default=False, verbose_name='排除试营原料')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    file_path = models.CharField(max_length=255, blank=True, verbose_name='文件路径')
    error_log = models.TextField(blank=True, verbose_name='错误日志')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')

    class Meta:
        verbose_name = '报表导出任务'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.task_id} - {self.get_report_type_display()}'
