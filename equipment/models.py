from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel, User
from auditlog.registry import auditlog


class EquipmentCategory(models.Model):
    name = models.CharField(_('类别名称'), max_length=100, unique=True)
    description = models.TextField(_('描述'), blank=True)
    requires_training = models.BooleanField(_('需要培训'), default=True)
    is_dangerous = models.BooleanField(_('危险设备'), default=False)
    sort_order = models.IntegerField(_('排序'), default=0)

    class Meta:
        verbose_name = _('设备类别')
        verbose_name_plural = _('设备类别')
        ordering = ['sort_order', 'name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['requires_training']),
            models.Index(fields=['is_dangerous']),
        ]

    def __str__(self):
        return self.name


class Equipment(BaseModel):
    class Status(models.TextChoices):
        AVAILABLE = 'available', _('可用')
        IN_USE = 'in_use', _('使用中')
        MAINTENANCE = 'maintenance', _('维护中')
        BROKEN = 'broken', _('故障')
        RETIRED = 'retired', _('已报废')

    name = models.CharField(_('设备名称'), max_length=200)
    category = models.ForeignKey(
        EquipmentCategory,
        on_delete=models.PROTECT,
        related_name='equipments',
        verbose_name=_('设备类别')
    )
    model_number = models.CharField(_('型号'), max_length=100, blank=True)
    serial_number = models.CharField(_('序列号'), max_length=100, blank=True)
    location = models.CharField(_('存放位置'), max_length=200)
    status = models.CharField(
        _('状态'),
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE
    )
    description = models.TextField(_('设备描述'), blank=True)
    specifications = models.JSONField(_('规格参数'), default=dict, blank=True)
    purchase_date = models.DateField(_('购买日期'), null=True, blank=True)
    last_maintenance_date = models.DateField(_('上次维护日期'), null=True, blank=True)
    next_maintenance_date = models.DateField(_('下次维护日期'), null=True, blank=True)
    qr_code = models.ImageField(_('二维码'), upload_to='qr_codes/', blank=True, null=True)
    image = models.ImageField(_('设备图片'), upload_to='equipment/', blank=True, null=True)
    max_booking_hours = models.IntegerField(_('最长预约时长(小时)'), default=4)
    require_approval = models.BooleanField(_('需要审批'), default=False)
    usage_count = models.IntegerField(_('使用次数'), default=0)

    class Meta:
        verbose_name = _('设备')
        verbose_name_plural = _('设备')
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['category']),
            models.Index(fields=['status']),
            models.Index(fields=['location']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.name} ({self.get_status_display()})'

    @property
    def is_available(self):
        return self.status == self.Status.AVAILABLE

    @property
    def requires_training(self):
        return self.category.requires_training

    @property
    def is_dangerous(self):
        return self.category.is_dangerous


class EquipmentUsageLog(BaseModel):
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name='usage_logs',
        verbose_name=_('设备')
    )
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='equipment_usage_logs',
        verbose_name=_('使用人')
    )
    start_time = models.DateTimeField(_('开始时间'))
    end_time = models.DateTimeField(_('结束时间'), null=True, blank=True)
    notes = models.TextField(_('使用备注'), blank=True)

    class Meta:
        verbose_name = _('设备使用日志')
        verbose_name_plural = _('设备使用日志')
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['equipment', 'start_time']),
            models.Index(fields=['user', 'start_time']),
        ]

    def __str__(self):
        return f'{self.equipment.name} - {self.user.real_name}'


auditlog.register(EquipmentCategory)
auditlog.register(Equipment)
auditlog.register(EquipmentUsageLog)
