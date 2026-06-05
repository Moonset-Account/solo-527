from typing import Dict, Any, Optional, List
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from core.services import BaseService
from core.validators import BaseValidator
from core.models import User
from .models import Equipment, EquipmentCategory, EquipmentUsageLog


class EquipmentValidator(BaseValidator):
    required_permission_create = 'equipment.manage'
    required_permission_update = 'equipment.manage'
    required_permission_delete = 'equipment.manage'


class EquipmentService(BaseService[Equipment]):
    model = Equipment
    validator = EquipmentValidator()

    def get_available_equipment(self, category_id: Optional[str] = None) -> List[Equipment]:
        queryset = self.get_queryset().filter(status=Equipment.Status.AVAILABLE)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return list(queryset)

    def get_equipment_by_category(self, category_id: str) -> List[Equipment]:
        return list(self.get_queryset().filter(category_id=category_id))

    def update_status(self, instance: Equipment, status: str, user: Optional[User] = None) -> Equipment:
        if status not in dict(Equipment.Status.choices):
            raise ValidationError(f'无效的设备状态: {status}')
        return self.update(instance, {'status': status}, user=user)

    def increment_usage(self, instance: Equipment) -> Equipment:
        instance.usage_count += 1
        instance.save(update_fields=['usage_count', 'updated_at'])
        return instance

    @transaction.atomic
    def start_usage(self, equipment: Equipment, user: User, notes: str = '') -> EquipmentUsageLog:
        if not equipment.is_available:
            raise ValidationError('设备当前不可用')
        equipment.status = Equipment.Status.IN_USE
        equipment.save()
        usage_log = EquipmentUsageLog.objects.create(
            equipment=equipment,
            user=user,
            start_time=timezone.now(),
            notes=notes,
            created_by=user,
            updated_by=user,
        )
        return usage_log

    @transaction.atomic
    def end_usage(self, usage_log: EquipmentUsageLog, user: Optional[User] = None) -> EquipmentUsageLog:
        if usage_log.end_time:
            raise ValidationError('该使用记录已结束')
        usage_log.end_time = timezone.now()
        usage_log.updated_by = user
        usage_log.save()
        equipment = usage_log.equipment
        equipment.status = Equipment.Status.AVAILABLE
        equipment.save()
        self.increment_usage(equipment)
        return usage_log


class EquipmentCategoryService(BaseService[EquipmentCategory]):
    model = EquipmentCategory


class EquipmentUsageLogService(BaseService[EquipmentUsageLog]):
    model = EquipmentUsageLog

    def get_user_usage_logs(self, user_id: str) -> List[EquipmentUsageLog]:
        return list(self.get_queryset().filter(user_id=user_id).order_by('-start_time'))

    def get_equipment_usage_logs(self, equipment_id: str) -> List[EquipmentUsageLog]:
        return list(self.get_queryset().filter(equipment_id=equipment_id).order_by('-start_time'))
