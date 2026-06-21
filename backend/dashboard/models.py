from django.db import models
from django.utils.translation import gettext_lazy as _
from users.models import User
from contracts.models import FrameworkContract


class Notification(models.Model):
    NOTIFICATION_TYPE_CHOICES = [
        ('contract_expiry', _('合同到期提醒')),
        ('approval_pending', _('待审批通知')),
        ('supplier_risk', _('供应商风险提醒')),
        ('invoice_overdue', _('发票逾期提醒')),
        ('price_change', _('价格变动通知')),
        ('system', _('系统通知')),
    ]

    PRIORITY_CHOICES = [
        ('high', _('高')),
        ('medium', _('中')),
        ('low', _('低')),
    ]

    notification_type = models.CharField(_('通知类型'), max_length=50, choices=NOTIFICATION_TYPE_CHOICES)
    priority = models.CharField(_('优先级'), max_length=20, choices=PRIORITY_CHOICES, default='medium')
    title = models.CharField(_('标题'), max_length=200)
    content = models.TextField(_('内容'))
    related_contract = models.ForeignKey(FrameworkContract, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications', verbose_name=_('关联合同'))
    recipients = models.ManyToManyField(User, related_name='received_notifications', verbose_name=_('接收人'))
    read_by = models.ManyToManyField(User, related_name='read_notifications', blank=True, verbose_name=_('已读人'))
    is_handled = models.BooleanField(_('是否已处理'), default=False)
    handled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='handled_notifications', verbose_name=_('处理人'))
    handled_at = models.DateTimeField(_('处理时间'), null=True, blank=True)
    handle_result = models.TextField(_('处理结果'), blank=True)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)

    class Meta:
        verbose_name = _('通知')
        verbose_name_plural = _('通知')
        ordering = ['-priority', '-created_at']

    def __str__(self):
        return f'{self.title} - {self.get_notification_type_display()}'


class DashboardWidget(models.Model):
    WIDGET_TYPE_CHOICES = [
        ('price_fluctuation', _('价格波动')),
        ('contract_status', _('合同状态统计')),
        ('supplier_risk', _('供应商风险分布')),
        ('invoice_status', _('发票状态统计')),
        ('usage_trend', _('用量趋势')),
        ('approval_pending', _('待办审批')),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dashboard_widgets', verbose_name=_('用户'))
    widget_type = models.CharField(_('组件类型'), max_length=50, choices=WIDGET_TYPE_CHOICES)
    title = models.CharField(_('组件标题'), max_length=100)
    config = models.JSONField(_('组件配置'), default=dict)
    position = models.PositiveIntegerField(_('显示顺序'), default=0)
    is_visible = models.BooleanField(_('是否显示'), default=True)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        verbose_name = _('看板组件')
        verbose_name_plural = _('看板组件')
        ordering = ['user', 'position']
        unique_together = ['user', 'widget_type']

    def __str__(self):
        return f'{self.user} - {self.title}'


class OperationLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='operation_logs', verbose_name=_('操作人'))
    action = models.CharField(_('操作动作'), max_length=100)
    module = models.CharField(_('所属模块'), max_length=50)
    target_type = models.CharField(_('目标类型'), max_length=100, blank=True)
    target_id = models.PositiveIntegerField(_('目标ID'), null=True, blank=True)
    description = models.TextField(_('操作描述'), blank=True)
    ip_address = models.GenericIPAddressField(_('IP地址'), null=True, blank=True)
    user_agent = models.CharField(_('客户端信息'), max_length=500, blank=True)
    created_at = models.DateTimeField(_('操作时间'), auto_now_add=True)

    class Meta:
        verbose_name = _('操作日志')
        verbose_name_plural = _('操作日志')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user} - {self.action} - {self.module}'
