from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.accounts.models import User


class DashboardWidget(models.Model):
    WIDGET_TYPE_CHOICES = (
        ('stat_card', '统计卡片'),
        ('line_chart', '折线图'),
        ('bar_chart', '柱状图'),
        ('pie_chart', '饼图'),
        ('table', '数据表格'),
        ('list', '列表'),
        ('gauge', '仪表盘'),
    )
    
    DATA_SOURCE_CHOICES = (
        ('bookings_today', '今日预约'),
        ('bookings_this_week', '本周预约'),
        ('arrivals_today', '今日到店'),
        ('revenue_today', '今日营收'),
        ('revenue_this_month', '本月营收'),
        ('new_memberships', '新增会员'),
        ('conversion_rate', '转化率'),
        ('pending_reminders', '待处理提醒'),
        ('service_status', '服务状态分布'),
        ('payment_methods', '支付方式分布'),
        ('revenue_trend', '营收趋势'),
        ('top_services', '热门服务'),
        ('staff_performance', '员工业绩'),
        ('cashier_discrepancies', '收银差异'),
        ('test_drive_slots', '试驾时段'),
    )
    
    name = models.CharField(_('组件名称'), max_length=100)
    widget_type = models.CharField(_('组件类型'), max_length=30, choices=WIDGET_TYPE_CHOICES)
    data_source = models.CharField(_('数据源'), max_length=50, choices=DATA_SOURCE_CHOICES)
    title = models.CharField(_('显示标题'), max_length=100)
    icon = models.CharField(_('图标'), max_length=50, null=True, blank=True)
    color_scheme = models.CharField(_('配色方案'), max_length=30, default='default')
    size = models.CharField(_('尺寸'), max_length=20, default='medium')
    refresh_interval = models.IntegerField(_('刷新间隔(秒)'), default=300)
    position = models.IntegerField(_('排序位置'), default=0)
    is_visible = models.BooleanField(_('是否显示'), default=True)
    roles = models.JSONField(_('可见角色'), default=list, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='widgets')
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        ordering = ['position']
        verbose_name = _('看板组件')
        verbose_name_plural = _('看板组件')

    def __str__(self):
        return f'{self.title} - {self.get_widget_type_display()}'


class DashboardLayout(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='dashboard_layouts')
    name = models.CharField(_('布局名称'), max_length=100, default='默认布局')
    widgets = models.ManyToManyField(DashboardWidget, through='LayoutWidget', related_name='layouts')
    is_default = models.BooleanField(_('是否默认'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('看板布局')
        verbose_name_plural = _('看板布局')

    def __str__(self):
        return f'{self.user.username} - {self.name}'


class LayoutWidget(models.Model):
    layout = models.ForeignKey(DashboardLayout, on_delete=models.CASCADE, related_name='layout_widgets')
    widget = models.ForeignKey(DashboardWidget, on_delete=models.CASCADE, related_name='layout_widgets')
    row = models.IntegerField(_('行'), default=0)
    col = models.IntegerField(_('列'), default=0)
    width = models.IntegerField(_('宽度'), default=1)
    height = models.IntegerField(_('高度'), default=1)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)

    class Meta:
        ordering = ['row', 'col']
        unique_together = ('layout', 'widget')
        verbose_name = _('布局组件关联')
        verbose_name_plural = _('布局组件关联')


class Alert(models.Model):
    ALERT_TYPE_CHOICES = (
        ('info', '信息'),
        ('warning', '警告'),
        ('danger', '危险'),
        ('success', '成功'),
    )
    
    ALERT_SOURCE_CHOICES = (
        ('booking', '预约'),
        ('payment', '支付'),
        ('conversion', '转化'),
        ('inventory', '库存'),
        ('staff', '员工'),
        ('system', '系统'),
    )
    
    alert_type = models.CharField(_('告警类型'), max_length=20, choices=ALERT_TYPE_CHOICES, default='info')
    source = models.CharField(_('来源'), max_length=30, choices=ALERT_SOURCE_CHOICES)
    title = models.CharField(_('标题'), max_length=200)
    message = models.TextField(_('消息内容'))
    related_id = models.IntegerField(_('关联ID'), null=True, blank=True)
    related_model = models.CharField(_('关联模型'), max_length=100, null=True, blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='alerts')
    is_read = models.BooleanField(_('已读'), default=False)
    read_at = models.DateTimeField(_('读取时间'), null=True, blank=True)
    is_action_required = models.BooleanField(_('需要处理'), default=False)
    is_resolved = models.BooleanField(_('已处理'), default=False)
    resolved_at = models.DateTimeField(_('处理时间'), null=True, blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_alerts')
    resolution_notes = models.TextField(_('处理说明'), null=True, blank=True)
    is_demo = models.BooleanField(_('演示数据'), default=False)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('告警通知')
        verbose_name_plural = _('告警通知')

    def __str__(self):
        return f'{self.get_alert_type_display()} - {self.title}'
