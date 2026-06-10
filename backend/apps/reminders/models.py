from datetime import timedelta

from django.db import models
from django.utils import timezone

from apps.users.models import User


class ReminderRule(models.Model):
    TRIGGER_TYPE_CHOICES = (
        ('inventory_conflict', '房态冲突'),
        ('order_status', '订单状态'),
        ('checkin_reminder', '入住提醒'),
        ('cleaning_due', '清洁任务'),
        ('payment_due', '支付提醒'),
        ('custom', '自定义'),
    )

    LEVEL_CHOICES = (
        (1, '紧急'),
        (2, '重要'),
        (3, '一般'),
        (4, '通知'),
    )

    LEVEL_COLORS = {
        1: '#E53935',
        2: '#FB8C00',
        3: '#FDD835',
        4: '#43A047',
    }

    id = models.BigAutoField(primary_key=True)
    name = models.CharField('规则名称', max_length=100)
    trigger_type = models.CharField('触发类型', max_length=50, choices=TRIGGER_TYPE_CHOICES)
    level = models.IntegerField('级别', choices=LEVEL_CHOICES, default=3)
    color = models.CharField('颜色', max_length=7, default='#FDD835')
    time_limit_minutes = models.IntegerField('处理时限(分钟)', default=60)
    conditions = models.JSONField('触发条件', default=dict, blank=True)
    actions = models.JSONField('执行动作', default=list, blank=True)
    is_active = models.BooleanField('是否启用', default=True)
    description = models.TextField('描述', blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_reminder_rules',
        verbose_name='创建人'
    )
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        db_table = 'reminder_rule'
        verbose_name = '提醒规则'
        verbose_name_plural = '提醒规则'
        ordering = ['level', '-created_at']

    def __str__(self):
        return f'{self.name} (Level {self.level})'

    def save(self, *args, **kwargs):
        if not self.color or self.color == '#FDD835':
            self.color = self.LEVEL_COLORS.get(self.level, '#FDD835')
        super().save(*args, **kwargs)

    @property
    def level_display(self):
        return dict(self.LEVEL_CHOICES).get(self.level, str(self.level))


class Reminder(models.Model):
    STATUS_CHOICES = (
        ('pending', '待处理'),
        ('processing', '处理中'),
        ('resolved', '已解决'),
        ('ignored', '已忽略'),
    )

    RELATED_TYPE_CHOICES = (
        ('order', '订单'),
        ('inventory', '房态'),
        ('cleaning', '清洁任务'),
        ('payment', '支付'),
        ('system', '系统'),
    )

    id = models.BigAutoField(primary_key=True)
    rule = models.ForeignKey(
        ReminderRule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reminders',
        verbose_name='规则'
    )
    rule_name = models.CharField('规则名称', max_length=100, blank=True)
    level = models.IntegerField('级别', choices=ReminderRule.LEVEL_CHOICES, default=3)
    color = models.CharField('颜色', max_length=7, default='#FDD835')
    title = models.CharField('标题', max_length=200)
    content = models.TextField('内容', blank=True)
    related_type = models.CharField('关联类型', max_length=20, choices=RELATED_TYPE_CHOICES)
    related_id = models.UUIDField('关联ID', null=True, blank=True)
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    time_limit = models.DateTimeField('处理时限', null=True, blank=True)
    escalated = models.BooleanField('是否已升级', default=False)
    original_level = models.IntegerField('原始级别', null=True, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    handled_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='handled_reminders',
        verbose_name='处理人'
    )
    handled_at = models.DateTimeField('处理时间', null=True, blank=True)
    handle_notes = models.TextField('处理备注', blank=True)

    class Meta:
        db_table = 'reminder'
        verbose_name = '提醒'
        verbose_name_plural = '提醒'
        indexes = [
            models.Index(
                fields=['status', 'level'],
                name='idx_reminders_pending',
                condition=models.Q(status='pending')
            ),
            models.Index(fields=['related_type', 'related_id'], name='idx_reminders_related'),
        ]
        ordering = ['level', 'created_at']

    def __str__(self):
        return f'{self.get_level_display()} - {self.title}'

    def save(self, *args, **kwargs):
        if self.rule and not self.rule_name:
            self.rule_name = self.rule.name
        if not self.color:
            self.color = ReminderRule.LEVEL_COLORS.get(self.level, '#FDD835')
        if not self.time_limit and self.rule:
            self.time_limit = timezone.now() + timedelta(minutes=self.rule.time_limit_minutes)
        super().save(*args, **kwargs)

    @property
    def level_display(self):
        return dict(ReminderRule.LEVEL_CHOICES).get(self.level, str(self.level))

    @property
    def is_overdue(self):
        if not self.time_limit or self.status in ['resolved', 'ignored']:
            return False
        return timezone.now() > self.time_limit

    @property
    def remaining_minutes(self):
        if not self.time_limit:
            return None
        delta = self.time_limit - timezone.now()
        return max(0, int(delta.total_seconds() // 60))
