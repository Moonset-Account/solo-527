from django.db import models
from django.conf import settings
from apps.projects.models import Project


class Budget(models.Model):
    """预算主表"""
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('submitted', '已提交'),
        ('approved', '已批准'),
        ('rejected', '已驳回'),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='budgets', verbose_name='项目')
    version = models.CharField('版本号', max_length=20, default='v1.0')
    name = models.CharField('预算名称', max_length=200)
    description = models.TextField('预算说明', blank=True)

    total_amount = models.DecimalField('预算总额', max_digits=14, decimal_places=2, default=0)
    material_cost = models.DecimalField('材料成本', max_digits=14, decimal_places=2, default=0)
    labor_cost = models.DecimalField('人工成本', max_digits=14, decimal_places=2, default=0)
    equipment_cost = models.DecimalField('设备成本', max_digits=14, decimal_places=2, default=0)
    other_cost = models.DecimalField('其他成本', max_digits=14, decimal_places=2, default=0)

    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='draft')
    is_current = models.BooleanField('是否当前版本', default=True)
    warning_threshold = models.DecimalField('预警阈值(%)', max_digits=5, decimal_places=2, default=10)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='created_budgets', verbose_name='创建人', null=True, blank=True
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='approved_budgets', verbose_name='审批人', null=True, blank=True
    )
    approved_at = models.DateTimeField('审批时间', null=True, blank=True)

    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '预算'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']
        unique_together = [['project', 'version']]

    def __str__(self):
        return f'{self.project.code} - {self.name} ({self.version})'

    def calculate_total(self):
        self.total_amount = self.material_cost + self.labor_cost + self.equipment_cost + self.other_cost
        return self.total_amount


class BudgetItem(models.Model):
    """预算明细项"""
    CATEGORY_CHOICES = [
        ('material', '材料'),
        ('labor', '人工'),
        ('equipment', '设备'),
        ('other', '其他'),
    ]

    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='items', verbose_name='预算')
    category = models.CharField('类别', max_length=20, choices=CATEGORY_CHOICES)
    name = models.CharField('项目名称', max_length=200)
    specification = models.CharField('规格型号', max_length=200, blank=True)
    unit = models.CharField('单位', max_length=20, blank=True)
    quantity = models.DecimalField('数量', max_digits=12, decimal_places=2, default=0)
    unit_price = models.DecimalField('单价', max_digits=12, decimal_places=2, default=0)
    amount = models.DecimalField('金额', max_digits=14, decimal_places=2, default=0)
    remark = models.TextField('备注', blank=True)
    sort_order = models.IntegerField('排序', default=0)

    class Meta:
        verbose_name = '预算明细'
        verbose_name_plural = verbose_name
        ordering = ['sort_order', 'id']

    def __str__(self):
        return f'{self.name} - {self.quantity}{self.unit}'

    def calculate_amount(self):
        self.amount = self.quantity * self.unit_price
        return self.amount


class BudgetChange(models.Model):
    """预算变更记录（增项/减项）"""
    TYPE_CHOICES = [
        ('addition', '增项'),
        ('deduction', '减项'),
    ]

    STATUS_CHOICES = [
        ('pending', '待确认'),
        ('confirmed', '已确认'),
        ('rejected', '已拒绝'),
    ]

    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='changes', verbose_name='预算')
    type = models.CharField('类型', max_length=20, choices=TYPE_CHOICES)
    name = models.CharField('变更名称', max_length=200)
    description = models.TextField('变更说明', blank=True)
    amount = models.DecimalField('变更金额', max_digits=14, decimal_places=2, default=0)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')

    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='requested_changes', verbose_name='申请人', null=True, blank=True
    )
    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        related_name='confirmed_changes', verbose_name='确认人', null=True, blank=True
    )
    confirmed_at = models.DateTimeField('确认时间', null=True, blank=True)

    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '预算变更'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_type_display()} - {self.name}'


class BudgetWarning(models.Model):
    """预算预警"""
    LEVEL_CHOICES = [
        ('info', '提示'),
        ('warning', '警告'),
        ('danger', '严重'),
    ]

    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='warnings', verbose_name='预算')
    level = models.CharField('级别', max_length=20, choices=LEVEL_CHOICES, default='warning')
    title = models.CharField('标题', max_length=200)
    message = models.TextField('预警内容')
    current_value = models.DecimalField('当前值', max_digits=14, decimal_places=2, default=0)
    threshold_value = models.DecimalField('阈值', max_digits=14, decimal_places=2, default=0)
    is_read = models.BooleanField('已读', default=False)
    is_resolved = models.BooleanField('已处理', default=False)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        verbose_name='处理人', null=True, blank=True
    )
    resolved_at = models.DateTimeField('处理时间', null=True, blank=True)
    resolved_note = models.TextField('处理备注', blank=True)

    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '预算预警'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_level_display()} - {self.title}'


class BudgetDashboard(models.Model):
    """预算看板快照（用于报表）"""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='dashboard_snapshots', verbose_name='项目')
    budget = models.ForeignKey(Budget, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='预算')
    snapshot_date = models.DateField('快照日期')
    budget_amount = models.DecimalField('预算金额', max_digits=14, decimal_places=2, default=0)
    actual_amount = models.DecimalField('实际金额', max_digits=14, decimal_places=2, default=0)
    change_amount = models.DecimalField('变更金额', max_digits=14, decimal_places=2, default=0)
    material_actual = models.DecimalField('材料实际', max_digits=14, decimal_places=2, default=0)
    labor_actual = models.DecimalField('人工实际', max_digits=14, decimal_places=2, default=0)
    warning_count = models.IntegerField('预警数量', default=0)

    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '预算看板快照'
        verbose_name_plural = verbose_name
        ordering = ['-snapshot_date']
        unique_together = [['project', 'snapshot_date']]

    @property
    def usage_rate(self):
        if self.budget_amount == 0:
            return 0
        return (self.actual_amount / self.budget_amount) * 100
