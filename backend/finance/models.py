from django.db import models
from django.conf import settings
from children.models import Child


class FeeItem(models.Model):
    FEE_TYPE_CHOICES = [
        ('tuition', '学费'),
        ('meal', '餐费'),
        ('activity', '活动费'),
        ('material', '材料费'),
        ('other', '其他'),
    ]
    name = models.CharField('费用名称', max_length=100)
    fee_type = models.CharField('费用类型', max_length=20, choices=FEE_TYPE_CHOICES, default='tuition')
    amount = models.DecimalField('金额', max_digits=10, decimal_places=2)
    due_date = models.DateField('截止日期', null=True, blank=True)
    class_group = models.ForeignKey(
        'children.ClassGroup', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='fee_items', verbose_name='适用班级',
    )
    is_active = models.BooleanField('有效', default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, verbose_name='创建人',
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        db_table = 'finance_feeitem'
        verbose_name = '收费项目'
        verbose_name_plural = verbose_name
        indexes = [
            models.Index(fields=['fee_type', 'is_active'], name='idx_feeitem_type_active'),
        ]

    def __str__(self):
        return f'{self.name} - ¥{self.amount}'


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', '待缴费'),
        ('paid', '已缴费'),
        ('overdue', '已逾期'),
        ('waived', '已减免'),
    ]
    child = models.ForeignKey(
        Child, on_delete=models.CASCADE,
        related_name='payments', verbose_name='儿童',
    )
    fee_item = models.ForeignKey(
        FeeItem, on_delete=models.CASCADE,
        related_name='payments', verbose_name='收费项目',
    )
    amount = models.DecimalField('应缴金额', max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField('实缴金额', max_digits=10, decimal_places=2, default=0)
    status = models.CharField('状态', max_length=10, choices=STATUS_CHOICES, default='pending')
    due_date = models.DateField('截止日期', null=True, blank=True)
    paid_at = models.DateTimeField('缴费时间', null=True, blank=True)
    remark = models.TextField('备注', blank=True, default='')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'finance_payment'
        verbose_name = '缴费记录'
        verbose_name_plural = verbose_name
        indexes = [
            models.Index(fields=['child', 'status'], name='idx_payment_child_status'),
            models.Index(fields=['status', 'due_date'], name='idx_payment_status_due'),
        ]

    def __str__(self):
        return f'{self.child.name} - {self.fee_item.name} - {self.get_status_display()}'


class LeaveRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', '待审批'),
        ('approved', '已批准'),
        ('rejected', '已拒绝'),
    ]
    child = models.ForeignKey(
        Child, on_delete=models.CASCADE,
        related_name='leave_requests', verbose_name='儿童',
    )
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='leave_requests', verbose_name='申请人',
    )
    start_date = models.DateField('开始日期')
    end_date = models.DateField('结束日期')
    reason = models.TextField('请假原因')
    status = models.CharField('状态', max_length=10, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reviewed_leaves', verbose_name='审批人',
    )
    review_remark = models.TextField('审批备注', blank=True, default='')
    created_at = models.DateTimeField('申请时间', auto_now_add=True)
    reviewed_at = models.DateTimeField('审批时间', null=True, blank=True)

    class Meta:
        db_table = 'finance_leaverequest'
        verbose_name = '请假申请'
        verbose_name_plural = verbose_name
        indexes = [
            models.Index(fields=['child', 'status'], name='idx_leave_child_status'),
            models.Index(fields=['requester', 'status'], name='idx_leave_requester_status'),
        ]

    def __str__(self):
        return f'{self.child.name} - {self.start_date} ~ {self.end_date} ({self.get_status_display()})'
