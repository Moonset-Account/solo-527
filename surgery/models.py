from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
from inventory.models import Supply, Batch
from datetime import date


class SurgicalTemplate(models.Model):
    name = models.CharField(max_length=200, verbose_name='术式名称')
    code = models.CharField(max_length=50, unique=True, verbose_name='术式编码')
    department = models.CharField(max_length=100, verbose_name='所属科室')
    description = models.TextField(blank=True, verbose_name='术式描述')
    estimated_duration = models.IntegerField(default=120, verbose_name='预计时长(分钟)')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, verbose_name='创建人')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '术式模板'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.name} ({self.code})'


class TemplateSupplyItem(models.Model):
    ITEM_TYPE_CHOICES = [
        ('REQUIRED', '必备耗材'),
        ('HIGH_VALUE', '高值耗材'),
        ('DEVICE', '器械包'),
    ]

    template = models.ForeignKey(SurgicalTemplate, on_delete=models.CASCADE, related_name='supply_items', verbose_name='术式模板')
    supply = models.ForeignKey(Supply, on_delete=models.PROTECT, verbose_name='耗材')
    item_type = models.CharField(max_length=20, choices=ITEM_TYPE_CHOICES, default='REQUIRED', verbose_name='物品类型')
    quantity = models.IntegerField(default=1, verbose_name='数量')
    remark = models.CharField(max_length=200, blank=True, verbose_name='备注')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')

    class Meta:
        verbose_name = '模板耗材项'
        verbose_name_plural = verbose_name
        unique_together = ('template', 'supply')

    def __str__(self):
        return f'{self.template.name} - {self.supply.name} x{self.quantity}'


class OperationSchedule(models.Model):
    STATUS_CHOICES = [
        ('SCHEDULED', '已排班'),
        ('PREPARING', '备包中'),
        ('READY', '已备妥'),
        ('IN_PROGRESS', '进行中'),
        ('COMPLETED', '已完成'),
        ('CANCELLED', '已取消'),
        ('CHANGED', '已换术式'),
    ]

    operation_date = models.DateField(verbose_name='手术日期')
    operation_room = models.CharField(max_length=50, verbose_name='手术室')
    patient_name = models.CharField(max_length=100, verbose_name='患者姓名')
    patient_id = models.CharField(max_length=50, verbose_name='住院号')
    template = models.ForeignKey(SurgicalTemplate, on_delete=models.PROTECT, verbose_name='术式模板')
    surgeon = models.CharField(max_length=100, verbose_name='主刀医生')
    anesthetist = models.CharField(max_length=100, verbose_name='麻醉医生')
    nurse = models.ForeignKey(User, on_delete=models.PROTECT, related_name='assigned_operations', verbose_name='巡回护士')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED', verbose_name='状态')
    original_template = models.ForeignKey(SurgicalTemplate, on_delete=models.PROTECT, related_name='changed_operations', null=True, blank=True, verbose_name='原术式模板')
    schedule_time = models.TimeField(verbose_name='预计时间')
    start_time = models.DateTimeField(null=True, blank=True, verbose_name='开始时间')
    end_time = models.DateTimeField(null=True, blank=True, verbose_name='结束时间')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '手术排班'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.operation_date} {self.operation_room} - {self.patient_name}'

    def change_template(self, new_template, operator):
        if self.status in ['IN_PROGRESS', 'COMPLETED']:
            raise ValidationError('手术进行中或已完成，无法更换术式')
        self.original_template = self.template
        self.template = new_template
        self.status = 'CHANGED'
        self.save()
        self.validate_prepared_items(operator)

    def validate_prepared_items(self, operator):
        prepared_items = self.prepared_items.all()
        validation_results = []
        new_items = self.template.supply_items.all()
        new_supply_ids = set(item.supply_id for item in new_items)
        old_supply_ids = set(item.supply_id for item in prepared_items)

        to_add = new_supply_ids - old_supply_ids
        to_remove = old_supply_ids - new_supply_ids
        to_check = old_supply_ids & new_supply_ids

        for supply_id in to_add:
            supply = Supply.objects.get(id=supply_id)
            required_item = new_items.filter(supply_id=supply_id).first()
            valid_batches = Batch.objects.filter(
                supply=supply, is_expired=False
            ).order_by('expiry_date')
            batch_info = None
            if valid_batches.exists():
                batch = valid_batches.first()
                batch_info = {
                    'id': batch.id,
                    'batch_number': batch.batch_number,
                    'expiry_date': str(batch.expiry_date),
                    'quantity': batch.quantity,
                    'storage_location': batch.storage_location,
                    'days_to_expire': batch.days_to_expire,
                    'is_warning': batch.is_warning,
                }
            validation_results.append({
                'type': 'ADD',
                'supply_id': supply.id,
                'supply_name': supply.name,
                'supply_code': supply.code,
                'supply_type': supply.supply_type,
                'required_quantity': required_item.quantity if required_item else 1,
                'unit': supply.unit,
                'available_batch': batch_info,
                'total_stock': supply.total_stock,
                'message': f'需要补充: {supply.name} x{required_item.quantity if required_item else 1}{supply.unit}'
            })

        for supply_id in to_remove:
            supply = Supply.objects.get(id=supply_id)
            prepared = prepared_items.filter(supply_id=supply_id).first()
            prepared_batch_info = None
            if prepared and prepared.batch:
                prepared_batch_info = {
                    'id': prepared.batch.id,
                    'batch_number': prepared.batch.batch_number,
                    'expiry_date': str(prepared.batch.expiry_date),
                }
            validation_results.append({
                'type': 'REMOVE',
                'supply_id': supply.id,
                'supply_name': supply.name,
                'supply_code': supply.code,
                'prepared_quantity': prepared.quantity if prepared else 0,
                'prepared_batch': prepared_batch_info,
                'unit': supply.unit,
                'message': f'需要退回: {supply.name} x{prepared.quantity if prepared else 0}{supply.unit}'
            })

        for supply_id in to_check:
            prepared = prepared_items.filter(supply_id=supply_id).first()
            required = new_items.filter(supply_id=supply_id).first()
            if prepared and required and prepared.batch:
                if prepared.batch.is_expired or prepared.batch.check_expired():
                    validation_results.append({
                        'type': 'EXPIRED',
                        'supply_id': prepared.supply.id,
                        'supply_name': prepared.supply.name,
                        'batch_id': prepared.batch.id,
                        'batch_number': prepared.batch.batch_number,
                        'expiry_date': str(prepared.batch.expiry_date),
                        'message': f'{prepared.supply.name} 批号 {prepared.batch.batch_number} 已过期，需更换'
                    })
                elif prepared.batch.is_warning:
                    validation_results.append({
                        'type': 'WARNING',
                        'supply_id': prepared.supply.id,
                        'supply_name': prepared.supply.name,
                        'batch_id': prepared.batch.id,
                        'batch_number': prepared.batch.batch_number,
                        'expiry_date': str(prepared.batch.expiry_date),
                        'days_to_expire': prepared.batch.days_to_expire,
                        'message': f'{prepared.supply.name} 批号 {prepared.batch.batch_number} 即将过期（{prepared.batch.days_to_expire}天）'
                    })
                if required.quantity != prepared.quantity:
                    validation_results.append({
                        'type': 'QUANTITY',
                        'supply_id': prepared.supply.id,
                        'supply_name': prepared.supply.name,
                        'current_quantity': prepared.quantity,
                        'required_quantity': required.quantity,
                        'unit': prepared.supply.unit,
                        'message': f'{prepared.supply.name} 数量不符: 当前{prepared.quantity}，需要{required.quantity}'
                    })

        return validation_results


class PreparedItem(models.Model):
    STATUS_CHOICES = [
        ('PREPARED', '已备妥'),
        ('VERIFIED', '已核对'),
        ('USED', '已使用'),
        ('RETURNED', '已退回'),
    ]

    schedule = models.ForeignKey(OperationSchedule, on_delete=models.CASCADE, related_name='prepared_items', verbose_name='手术排班')
    supply = models.ForeignKey(Supply, on_delete=models.PROTECT, verbose_name='耗材')
    batch = models.ForeignKey(Batch, on_delete=models.PROTECT, null=True, blank=True, verbose_name='批号')
    quantity = models.IntegerField(default=1, verbose_name='数量')
    item_type = models.CharField(max_length=20, default='REQUIRED', verbose_name='物品类型')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PREPARED', verbose_name='状态')
    storage_location = models.CharField(max_length=100, blank=True, verbose_name='器械包位置')
    prepared_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='prepared_items', verbose_name='备包人')
    verified_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='verified_items', null=True, blank=True, verbose_name='核对人')
    prepared_at = models.DateTimeField(auto_now_add=True, verbose_name='备包时间')
    verified_at = models.DateTimeField(null=True, blank=True, verbose_name='核对时间')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        verbose_name = '备包物品'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.schedule} - {self.supply.name}'

    def clean(self):
        if self.batch and self.batch.is_expired:
            raise ValidationError(f'批号 {self.batch.batch_number} 已过期，不能进入手术间')
        if self.batch and self.batch.supply_id != self.supply_id:
            raise ValidationError('批号与耗材不匹配')

    def verify(self, user):
        if self.batch and self.batch.check_expired():
            raise ValidationError(f'批号 {self.batch.batch_number} 已过期，无法核对')
        self.status = 'VERIFIED'
        self.verified_by = user
        self.verified_at = timezone.now()
        self.save()


class UsageRecord(models.Model):
    schedule = models.ForeignKey(OperationSchedule, on_delete=models.CASCADE, related_name='usage_records', verbose_name='手术排班')
    prepared_item = models.ForeignKey(PreparedItem, on_delete=models.PROTECT, verbose_name='备包物品')
    supply = models.ForeignKey(Supply, on_delete=models.PROTECT, verbose_name='耗材')
    batch = models.ForeignKey(Batch, on_delete=models.PROTECT, verbose_name='批号')
    quantity = models.IntegerField(verbose_name='数量')
    is_high_value = models.BooleanField(default=False, verbose_name='是否高值耗材')
    is_scan_created = models.BooleanField(default=False, verbose_name='是否扫码创建')
    used_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='usage_records', verbose_name='使用人')
    confirmed_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='confirmed_usages', null=True, blank=True, verbose_name='确认人')
    is_double_confirmed = models.BooleanField(default=False, verbose_name='是否双人确认')
    scan_time = models.DateTimeField(auto_now_add=True, verbose_name='扫码时间')
    confirm_time = models.DateTimeField(null=True, blank=True, verbose_name='确认时间')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        verbose_name = '领用记录'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.schedule} - {self.supply.name} x{self.quantity}'

    def confirm(self, user):
        if self.is_double_confirmed:
            raise ValidationError('已完成双人确认')
        if user.id == self.used_by_id:
            raise ValidationError('确认人不能与使用人相同')
        self.confirmed_by = user
        self.is_double_confirmed = True
        self.confirm_time = timezone.now()
        self.save()


class ReturnRecord(models.Model):
    RETURN_STATUS_CHOICES = [
        ('UNOPENED', '未拆封'),
        ('OPENED', '已拆封'),
        ('DAMAGED', '需报损'),
    ]

    schedule = models.ForeignKey(OperationSchedule, on_delete=models.CASCADE, related_name='return_records', verbose_name='手术排班')
    supply = models.ForeignKey(Supply, on_delete=models.PROTECT, verbose_name='耗材')
    batch = models.ForeignKey(Batch, on_delete=models.PROTECT, verbose_name='批号')
    quantity = models.IntegerField(verbose_name='数量')
    return_status = models.CharField(max_length=20, choices=RETURN_STATUS_CHOICES, default='UNOPENED', verbose_name='退包状态')
    is_high_value = models.BooleanField(default=False, verbose_name='是否高值耗材')
    returned_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='returned_items', verbose_name='退包人')
    confirmed_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='confirmed_returns', null=True, blank=True, verbose_name='确认人')
    is_double_confirmed = models.BooleanField(default=False, verbose_name='是否双人确认')
    return_time = models.DateTimeField(auto_now_add=True, verbose_name='退包时间')
    confirm_time = models.DateTimeField(null=True, blank=True, verbose_name='确认时间')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        verbose_name = '退包记录'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.get_return_status_display()} - {self.supply.name} x{self.quantity}'

    def confirm(self, user):
        if self.is_double_confirmed:
            raise ValidationError('已完成双人确认')
        if user.id == self.returned_by_id:
            raise ValidationError('确认人不能与退包人相同')
        self.confirmed_by = user
        self.is_double_confirmed = True
        self.confirm_time = timezone.now()
        self.save()


class HighValueAudit(models.Model):
    schedule = models.ForeignKey(OperationSchedule, on_delete=models.CASCADE, related_name='high_value_audits', verbose_name='手术排班')
    supply = models.ForeignKey(Supply, on_delete=models.PROTECT, verbose_name='高值耗材')
    batch = models.ForeignKey(Batch, on_delete=models.PROTECT, verbose_name='批号')
    quantity = models.IntegerField(verbose_name='数量')
    action_type = models.CharField(max_length=20, choices=[
        ('USED', '使用'),
        ('RETURNED', '退回'),
        ('DAMAGED', '报损'),
    ], verbose_name='操作类型')
    operator = models.ForeignKey(User, on_delete=models.PROTECT, related_name='high_value_actions', verbose_name='操作人')
    auditor = models.ForeignKey(User, on_delete=models.PROTECT, related_name='audited_high_value', null=True, blank=True, verbose_name='审核人')
    is_audited = models.BooleanField(default=False, verbose_name='是否已审核')
    action_time = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')
    audit_time = models.DateTimeField(null=True, blank=True, verbose_name='审核时间')
    remark = models.TextField(blank=True, verbose_name='备注')

    class Meta:
        verbose_name = '高值耗材审计'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'{self.get_action_type_display()} - {self.supply.name}'
