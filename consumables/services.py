from typing import Dict, Any, Optional, List
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from core.services import BaseService
from core.validators import BaseValidator
from core.models import User
from .models import Consumable, ConsumableCategory, ConsumableUsage, ConsumableRestock
from notifications.services import NotificationService


class ConsumableValidator(BaseValidator):
    required_permission_create = 'consumables.manage'
    required_permission_update = 'consumables.manage'
    required_permission_delete = 'consumables.manage'


class ConsumableUsageValidator(BaseValidator):
    required_permission_create = 'consumables.use'
    required_permission_update = 'consumables.manage'
    required_permission_delete = 'consumables.manage'


class ConsumableService(BaseService[Consumable]):
    model = Consumable
    validator = ConsumableValidator()

    def get_active_consumables(self, category_id: Optional[str] = None) -> List[Consumable]:
        queryset = self.get_queryset().filter(is_active=True)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return list(queryset.select_related('category'))

    def get_low_stock_consumables(self) -> List[Consumable]:
        return list(
            self.get_queryset()
            .filter(is_active=True, current_stock__lte=models.F('min_stock'))
            .select_related('category')
        )

    def search_consumables(self, query: str) -> List[Consumable]:
        return list(
            self.get_queryset()
            .filter(is_active=True)
            .filter(
                models.Q(name__icontains=query)
                | models.Q(sku__icontains=query)
                | models.Q(description__icontains=query)
            )
            .select_related('category')
        )

    @transaction.atomic
    def update_stock(self, consumable: Consumable, quantity: int, user: User) -> Consumable:
        if consumable.current_stock + quantity < 0:
            raise ValidationError('库存不足')

        consumable.current_stock += quantity
        consumable.updated_by = user
        consumable.save()

        if consumable.is_low_stock:
            from core.models import User
            admin_users = User.objects.filter(role__in=['admin', 'technician'])
            notification_service = NotificationService(user)
            notification_service.send_consumable_low_stock(consumable, list(admin_users))

        return consumable


class ConsumableUsageService(BaseService[ConsumableUsage]):
    model = ConsumableUsage
    validator = ConsumableUsageValidator()

    def get_user_usages(self, user_id: str, billed_only: Optional[bool] = None) -> List[ConsumableUsage]:
        queryset = self.get_queryset().filter(user_id=user_id)
        if billed_only is not None:
            queryset = queryset.filter(is_billed=billed_only)
        return list(queryset.select_related('consumable').order_by('-created_at'))

    def get_consumable_usages(self, consumable_id: str) -> List[ConsumableUsage]:
        return list(
            self.get_queryset()
            .filter(consumable_id=consumable_id)
            .select_related('user', 'consumable')
            .order_by('-created_at')
        )

    @transaction.atomic
    def record_usage(
        self,
        consumable: Consumable,
        user: User,
        quantity: int,
        booking=None,
        equipment=None,
        notes: str = ''
    ) -> ConsumableUsage:
        if quantity <= 0:
            raise ValidationError('使用数量必须大于0')
        if consumable.current_stock < quantity:
            raise ValidationError(f'库存不足，当前库存：{consumable.current_stock} {consumable.unit}')

        total_cost = consumable.unit_price * quantity

        usage = self.create({
            'consumable': consumable,
            'user': user,
            'booking': booking,
            'equipment': equipment,
            'quantity': quantity,
            'unit_price_at_usage': consumable.unit_price,
            'total_cost': total_cost,
            'notes': notes,
        }, user=user)

        consumable.current_stock -= quantity
        consumable.save()

        return usage

    @transaction.atomic
    def mark_as_billed(self, usage: ConsumableUsage, user: User) -> ConsumableUsage:
        if usage.is_billed:
            raise ValidationError('该使用记录已计费')
        usage.is_billed = True
        usage.billed_at = timezone.now()
        usage.updated_by = user
        usage.save()
        return usage

    @transaction.atomic
    def batch_mark_as_billed(self, usage_ids: List[str], user: User) -> int:
        return self.get_queryset().filter(
            id__in=usage_ids,
            is_billed=False
        ).update(
            is_billed=True,
            billed_at=timezone.now(),
            updated_by=user
        )


class ConsumableRestockService(BaseService[ConsumableRestock]):
    model = ConsumableRestock

    @transaction.atomic
    def create(self, data: Dict[str, Any], **kwargs) -> ConsumableRestock:
        data['total_cost'] = data['quantity'] * data['unit_cost']
        restock = super().create(data, **kwargs)

        consumable = restock.consumable
        consumable.current_stock += restock.quantity
        consumable.updated_by = kwargs.get('user')
        consumable.save()

        return restock


class ConsumableCategoryService(BaseService[ConsumableCategory]):
    model = ConsumableCategory
