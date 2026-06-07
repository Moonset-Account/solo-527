from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Store(models.Model):
    name = models.CharField(max_length=200, verbose_name='门店名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='门店编码')
    region = models.CharField(max_length=100, blank=True, verbose_name='所属区域')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')

    class Meta:
        verbose_name = '门店'
        verbose_name_plural = '门店'
        ordering = ['code']

    def __str__(self):
        return f'{self.name}({self.code})'


class Team(models.Model):
    name = models.CharField(max_length=100, verbose_name='班组名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='班组编码')
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='teams', verbose_name='所属门店')

    class Meta:
        verbose_name = '处理班组'
        verbose_name_plural = '处理班组'

    def __str__(self):
        return f'{self.name}'


class ProblemType(models.Model):
    name = models.CharField(max_length=100, verbose_name='问题类型')
    category = models.CharField(max_length=100, blank=True, verbose_name='问题大类')

    class Meta:
        verbose_name = '问题类型'
        verbose_name_plural = '问题类型'

    def __str__(self):
        return self.name


class WorkOrder(models.Model):
    STATUS_CHOICES = [
        ('pending', '待处理'),
        ('processing', '处理中'),
        ('completed', '已完成'),
        ('closed', '已关闭'),
    ]

    order_no = models.CharField(max_length=64, unique=True, verbose_name='工单编号')
    customer_name = models.CharField(max_length=100, verbose_name='客户姓名')
    customer_phone = models.CharField(max_length=20, verbose_name='客户手机号')
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='work_orders', verbose_name='门店')
    problem_type = models.ForeignKey(ProblemType, on_delete=models.SET_NULL, null=True, related_name='work_orders', verbose_name='问题类型')
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, related_name='work_orders', verbose_name='处理班组')
    handler = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='handled_orders', verbose_name='处理人')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='工单状态')
    description = models.TextField(blank=True, verbose_name='问题描述')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '工单'
        verbose_name_plural = '工单'
        ordering = ['-created_at']

    def __str__(self):
        return self.order_no


class VisitRecord(models.Model):
    VISIT_STATUS_CHOICES = [
        ('pending', '待回访'),
        ('completed', '已完成'),
        ('unreachable', '无法联系'),
        ('refused', '客户拒绝'),
    ]

    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name='visit_records', verbose_name='关联工单')
    visitor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='visit_records', verbose_name='回访人')
    visit_status = models.CharField(max_length=20, choices=VISIT_STATUS_CHOICES, default='pending', verbose_name='回访状态')
    satisfaction_score = models.IntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='满意度评分(1-5)'
    )
    recording_tags = models.JSONField(default=list, blank=True, verbose_name='录音标签')
    visit_note = models.TextField(blank=True, verbose_name='回访备注')
    visited_at = models.DateTimeField(null=True, blank=True, verbose_name='回访时间')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '回访记录'
        verbose_name_plural = '回访记录'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.work_order.order_no}-visit-{self.id}'

    @property
    def is_completed(self):
        return self.visit_status == settings.VISIT_COMPLETE_STATUS

    @property
    def is_low_score(self):
        if self.satisfaction_score is not None and self.is_completed:
            return self.satisfaction_score <= settings.LOW_SCORE_THRESHOLD
        return False


class Refund(models.Model):
    REFUND_STATUS_CHOICES = [
        ('pending', '待退款'),
        ('approved', '已审批'),
        ('refunded', '已退款'),
        ('rejected', '已驳回'),
    ]

    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name='refunds', verbose_name='关联工单')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='退款金额')
    status = models.CharField(max_length=20, choices=REFUND_STATUS_CHOICES, default='pending', verbose_name='退款状态')
    refund_time = models.DateTimeField(null=True, blank=True, verbose_name='退款时间')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '退款记录'
        verbose_name_plural = '退款记录'

    def __str__(self):
        return f'{self.work_order.order_no}-refund-{self.id}'


class SecondaryComplaint(models.Model):
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name='secondary_complaints', verbose_name='关联工单')
    complaint_type = models.CharField(max_length=100, verbose_name='投诉类型')
    complaint_time = models.DateTimeField(verbose_name='二次投诉时间')
    is_post_refund = models.BooleanField(default=False, verbose_name='是否退款后投诉')
    description = models.TextField(blank=True, verbose_name='投诉描述')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '二次投诉'
        verbose_name_plural = '二次投诉'

    def __str__(self):
        post_tag = '(退款后)' if self.is_post_refund else ''
        return f'{self.work_order.order_no}-complaint{post_tag}'

    @staticmethod
    def check_post_refund(work_order, complaint_time):
        refunds = Refund.objects.filter(
            work_order=work_order,
            status='refunded',
            refund_time__isnull=False,
            refund_time__lt=complaint_time,
        )
        return refunds.exists()


class StorePermission(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='store_permissions',
        verbose_name='用户',
    )
    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name='allowed_users',
        verbose_name='门店',
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='授权时间')

    class Meta:
        verbose_name = '门店权限'
        verbose_name_plural = '门店权限'
        unique_together = ('user', 'store')

    def __str__(self):
        return f'{self.user} -> {self.store}'


class MetricConfig(models.Model):
    DIMENSION_CHOICES = [
        ('store', '门店'),
        ('problem_type', '问题类型'),
        ('team', '处理班组'),
        ('handler', '处理人'),
    ]

    name = models.CharField(max_length=100, verbose_name='口径名称')
    dimension = models.CharField(max_length=20, choices=DIMENSION_CHOICES, verbose_name='对比维度')
    low_score_threshold = models.IntegerField(default=3, verbose_name='低分阈值')
    satisfaction_weight = models.FloatField(default=1.0, verbose_name='满意度权重')
    include_unreachable = models.BooleanField(default=False, verbose_name='是否包含无法联系记录')
    include_refused = models.BooleanField(default=False, verbose_name='是否包含客户拒绝记录')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name='创建人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '口径配置'
        verbose_name_plural = '口径配置'

    def __str__(self):
        return f'{self.name}({self.get_dimension_display()})'


class AsyncReport(models.Model):
    STATUS_CHOICES = [
        ('pending', '生成中'),
        ('completed', '已完成'),
        ('failed', '失败'),
    ]

    name = models.CharField(max_length=200, verbose_name='报表名称')
    report_type = models.CharField(max_length=50, verbose_name='报表类型')
    params = models.JSONField(default=dict, blank=True, verbose_name='查询参数')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    file_path = models.CharField(max_length=500, blank=True, verbose_name='文件路径')
    task_id = models.CharField(max_length=200, blank=True, verbose_name='Celery任务ID')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name='创建人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='完成时间')
    error_message = models.TextField(blank=True, verbose_name='错误信息')

    class Meta:
        verbose_name = '异步报表'
        verbose_name_plural = '异步报表'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name}-{self.get_status_display()}'


class AnomalyAnnotation(models.Model):
    ANOMALY_TYPE_CHOICES = [
        ('post_refund_complaint', '退款后二次投诉'),
        ('low_score_trend', '低分趋势异常'),
        ('data_quality', '数据质量异常'),
    ]

    related_work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, null=True, blank=True, related_name='annotations', verbose_name='关联工单')
    anomaly_type = models.CharField(max_length=30, choices=ANOMALY_TYPE_CHOICES, verbose_name='异常类型')
    annotation_text = models.TextField(verbose_name='注释内容')
    annotated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, verbose_name='注释人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '异常点注释'
        verbose_name_plural = '异常点注释'

    def __str__(self):
        return f'{self.get_anomaly_type_display()}: {self.annotation_text[:30]}'
