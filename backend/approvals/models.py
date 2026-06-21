from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from users.models import User


class ApprovalLevel(models.Model):
    name = models.CharField(_('审批层级名称'), max_length=100, unique=True)
    level_order = models.PositiveIntegerField(_('审批顺序'), unique=True)
    description = models.TextField(_('描述'), blank=True)
    is_active = models.BooleanField(_('是否启用'), default=True)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        verbose_name = _('审批层级')
        verbose_name_plural = _('审批层级')
        ordering = ['level_order']

    def __str__(self):
        return f'第{self.level_order}级 - {self.name}'


class ApprovalFlow(models.Model):
    FLOW_TYPE_CHOICES = [
        ('contract', _('合同审批')),
        ('invoice', _('发票审批')),
        ('supplier', _('供应商准入审批')),
        ('price_adjustment', _('价格调整审批')),
        ('risk_handle', _('风险处理审批')),
    ]

    name = models.CharField(_('流程名称'), max_length=100)
    flow_type = models.CharField(_('流程类型'), max_length=50, choices=FLOW_TYPE_CHOICES, unique=True)
    levels = models.ManyToManyField(ApprovalLevel, through='FlowLevelRelation', related_name='flows', verbose_name=_('审批层级'))
    description = models.TextField(_('描述'), blank=True)
    is_active = models.BooleanField(_('是否启用'), default=True)
    created_at = models.DateTimeField(_('创建时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        verbose_name = _('审批流程')
        verbose_name_plural = _('审批流程')
        ordering = ['id']

    def __str__(self):
        return self.name


class FlowLevelRelation(models.Model):
    flow = models.ForeignKey(ApprovalFlow, on_delete=models.CASCADE, verbose_name=_('审批流程'))
    level = models.ForeignKey(ApprovalLevel, on_delete=models.CASCADE, verbose_name=_('审批层级'))
    order = models.PositiveIntegerField(_('顺序号'))
    required_approvers = models.ManyToManyField(User, related_name='approval_level_relations', verbose_name=_('可审批人'))
    min_approvers = models.PositiveIntegerField(_('最少审批人数'), default=1)

    class Meta:
        verbose_name = _('流程层级关系')
        verbose_name_plural = _('流程层级关系')
        ordering = ['flow', 'order']
        unique_together = ['flow', 'level', 'order']

    def __str__(self):
        return f'{self.flow} - {self.level} (第{self.order}步)'


class ApprovalRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', _('待审批')),
        ('approved', _('已通过')),
        ('rejected', _('已驳回')),
        ('cancelled', _('已取消')),
        ('in_progress', _('审批中')),
    ]

    flow_type = models.CharField(_('流程类型'), max_length=50)
    title = models.CharField(_('审批标题'), max_length=200)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    status = models.CharField(_('审批状态'), max_length=30, choices=STATUS_CHOICES, default='pending')
    current_level_order = models.PositiveIntegerField(_('当前审批层级'), default=1)
    requester = models.ForeignKey(User, on_delete=models.PROTECT, related_name='submitted_approvals', verbose_name=_('申请人'))
    remarks = models.TextField(_('申请说明'), blank=True)
    created_at = models.DateTimeField(_('申请时间'), auto_now_add=True)
    updated_at = models.DateTimeField(_('更新时间'), auto_now=True)

    class Meta:
        verbose_name = _('审批申请')
        verbose_name_plural = _('审批申请')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} - {self.get_status_display()}'


class ApprovalRecord(models.Model):
    ACTION_CHOICES = [
        ('approve', _('同意')),
        ('reject', _('驳回')),
        ('transfer', _('转审')),
        ('comment', _('加签')),
    ]

    request = models.ForeignKey(ApprovalRequest, on_delete=models.CASCADE, related_name='records', verbose_name=_('审批申请'))
    level = models.ForeignKey(ApprovalLevel, on_delete=models.PROTECT, verbose_name=_('审批层级'))
    approver = models.ForeignKey(User, on_delete=models.PROTECT, related_name='approval_records', verbose_name=_('审批人'))
    action = models.CharField(_('审批动作'), max_length=20, choices=ACTION_CHOICES)
    comment = models.TextField(_('审批意见'), blank=True)
    transferred_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='transferred_approvals', verbose_name=_('转审给谁'))
    created_at = models.DateTimeField(_('审批时间'), auto_now_add=True)

    class Meta:
        verbose_name = _('审批记录')
        verbose_name_plural = _('审批记录')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.request} - {self.approver} - {self.get_action_display()}'
