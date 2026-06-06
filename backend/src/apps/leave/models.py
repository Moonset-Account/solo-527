from django.db import models
from core.models import BaseModel


class LeaveRequest(BaseModel):
    TYPE_CHOICES = (
        ('sick', '病假'),
        ('personal', '事假'),
        ('other', '其他'),
    )
    STATUS_CHOICES = (
        ('pending', '待审批'),
        ('approved', '已批准'),
        ('rejected', '已拒绝'),
        ('cancelled', '已取消'),
    )
    child = models.ForeignKey('children.Child', on_delete=models.CASCADE, related_name='leave_requests', verbose_name='儿童')
    leave_type = models.CharField('请假类型', max_length=20, choices=TYPE_CHOICES)
    start_date = models.DateField('开始日期')
    end_date = models.DateField('结束日期')
    start_session = models.CharField('开始时段', max_length=20, choices=(
        ('full', '全天'),
        ('morning', '上午'),
        ('afternoon', '下午'),
    ), default='full')
    end_session = models.CharField('结束时段', max_length=20, choices=(
        ('full', '全天'),
        ('morning', '上午'),
        ('afternoon', '下午'),
    ), default='full')
    reason = models.TextField('请假原因')
    attachments = models.JSONField('附件', default=list, blank=True)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='submitted_leaves', verbose_name='提交人')
    reviewed_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_leaves', verbose_name='审批人')
    reviewed_at = models.DateTimeField('审批时间', null=True, blank=True)
    review_comment = models.TextField('审批意见', blank=True)

    class Meta:
        verbose_name = '请假申请'
        verbose_name_plural = verbose_name
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.child.name} - {self.get_leave_type_display()}'

    @property
    def total_days(self):
        from datetime import timedelta
        delta = self.end_date - self.start_date
        days = delta.days + 1
        if self.start_session != 'full':
            days -= 0.5
        if self.end_session != 'full':
            days -= 0.5
        return max(0.5, days)
