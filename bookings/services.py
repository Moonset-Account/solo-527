from typing import Dict, Any, Optional, List
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, timedelta
from core.services import BaseService
from core.validators import BaseValidator
from core.models import User
from training.models import TrainingCertification
from .models import Booking, BookingConflict
from equipment.models import Equipment
from notifications.services import NotificationService
import secrets


class BookingValidator(BaseValidator):
    required_permission_create = 'equipment.book'
    required_permission_update = 'bookings.manage'
    required_permission_delete = 'bookings.manage'

    def _validate_common(self, data: Dict[str, Any], user: Optional[User] = None, instance=None, **kwargs) -> None:
        equipment = data.get('equipment') or (instance.equipment if instance else None)
        booking_user = data.get('user') or user

        if equipment and booking_user and equipment.requires_training:
            has_cert = TrainingCertification.objects.filter(
                user=booking_user,
                category=equipment.category,
                status=TrainingCertification.Status.VALID
            ).exists()
            if not has_cert:
                if equipment.is_dangerous:
                    raise ValidationError(
                        f'您尚未通过 {equipment.category.name} 的培训，'
                        f'危险设备必须先通过培训才能预约。请先申请培训。'
                    )
                else:
                    raise ValidationError(
                        f'您尚未通过 {equipment.category.name} 的培训，请先申请培训。'
                    )

        start_time = data.get('start_time')
        end_time = data.get('end_time')
        if start_time and end_time and equipment:
            conflict_qs = Booking.objects.filter(
                equipment=equipment,
                status__in=[Booking.Status.PENDING, Booking.Status.APPROVED, Booking.Status.IN_PROGRESS]
            ).filter(
                Q(start_time__lt=end_time) & Q(end_time__gt=start_time)
            )
            if instance:
                conflict_qs = conflict_qs.exclude(pk=instance.pk)
            if conflict_qs.exists():
                raise ValidationError('该时间段已有预约，请选择其他时间。')


class BookingService(BaseService[Booking]):
    model = Booking
    validator = BookingValidator()

    def get_user_bookings(self, user_id: str, status: Optional[str] = None) -> List[Booking]:
        queryset = self.get_queryset().filter(user_id=user_id)
        if status:
            queryset = queryset.filter(status=status)
        return list(queryset.order_by('-start_time'))

    def get_equipment_bookings(self, equipment_id: str, start_date: Optional[datetime] = None,
                               end_date: Optional[datetime] = None) -> List[Booking]:
        queryset = self.get_queryset().filter(
            equipment_id=equipment_id,
            status__in=[Booking.Status.PENDING, Booking.Status.APPROVED, Booking.Status.IN_PROGRESS]
        )
        if start_date:
            queryset = queryset.filter(start_time__gte=start_date)
        if end_date:
            queryset = queryset.filter(end_time__lte=end_date)
        return list(queryset.order_by('start_time'))

    def get_calendar_bookings(self, start_date: datetime, end_date: datetime,
                              equipment_id: Optional[str] = None) -> List[Booking]:
        queryset = self.get_queryset().filter(
            status__in=[Booking.Status.APPROVED, Booking.Status.IN_PROGRESS],
            start_time__gte=start_date,
            end_time__lte=end_date
        )
        if equipment_id:
            queryset = queryset.filter(equipment_id=equipment_id)
        return list(queryset.select_related('equipment', 'user'))

    @transaction.atomic
    def create(self, data: Dict[str, Any], **kwargs) -> Booking:
        if self.user and 'user' not in data:
            data['user'] = self.user

        equipment = data.get('equipment')
        if equipment and equipment.require_approval:
            data['status'] = Booking.Status.PENDING
        else:
            data['status'] = Booking.Status.APPROVED

        data['check_in_code'] = secrets.token_urlsafe(6)[:8]
        booking = super().create(data, **kwargs)

        notification_service = NotificationService(self.user)
        notification_service.send_booking_created(booking)

        return booking

    @transaction.atomic
    def approve(self, booking: Booking, approver: User, notes: str = '') -> Booking:
        if booking.status != Booking.Status.PENDING:
            raise ValidationError('只有待审批的预约可以审批')

        booking.status = Booking.Status.APPROVED
        booking.approved_by = approver
        booking.approved_at = timezone.now()
        booking.approval_notes = notes
        booking.updated_by = approver
        booking.save()

        notification_service = NotificationService(approver)
        notification_service.send_booking_approved(booking)

        return booking

    @transaction.atomic
    def reject(self, booking: Booking, approver: User, notes: str = '') -> Booking:
        if booking.status != Booking.Status.PENDING:
            raise ValidationError('只有待审批的预约可以拒绝')

        booking.status = Booking.Status.REJECTED
        booking.approved_by = approver
        booking.approved_at = timezone.now()
        booking.approval_notes = notes
        booking.updated_by = approver
        booking.save()

        notification_service = NotificationService(approver)
        notification_service.send_booking_rejected(booking)

        return booking

    @transaction.atomic
    def cancel(self, booking: Booking, user: User, notes: str = '') -> Booking:
        if booking.status not in [Booking.Status.PENDING, Booking.Status.APPROVED]:
            raise ValidationError('只有待审批或已确认的预约可以取消')

        booking.status = Booking.Status.CANCELLED
        booking.updated_by = user
        booking.approval_notes = notes if notes else booking.approval_notes
        booking.save()

        return booking

    @transaction.atomic
    def check_in(self, booking: Booking, user: User) -> Booking:
        if booking.status != Booking.Status.APPROVED:
            raise ValidationError('只有已确认的预约可以签到')
        if booking.is_checked_in:
            raise ValidationError('该预约已签到')

        booking.is_checked_in = True
        booking.checked_in_at = timezone.now()
        booking.status = Booking.Status.IN_PROGRESS
        booking.actual_start_time = timezone.now()
        booking.updated_by = user
        booking.save()

        return booking

    @transaction.atomic
    def complete(self, booking: Booking, user: User) -> Booking:
        if booking.status != Booking.Status.IN_PROGRESS:
            raise ValidationError('只有使用中的预约可以完成')

        booking.status = Booking.Status.COMPLETED
        booking.actual_end_time = timezone.now()
        booking.updated_by = user
        booking.save()

        return booking

    def check_conflicts(self, equipment: Equipment, start_time: datetime, end_time: datetime,
                        exclude_booking_id: Optional[str] = None) -> List[Booking]:
        queryset = Booking.objects.filter(
            equipment=equipment,
            status__in=[Booking.Status.PENDING, Booking.Status.APPROVED, Booking.Status.IN_PROGRESS]
        ).filter(
            Q(start_time__lt=end_time) & Q(end_time__gt=start_time)
        )
        if exclude_booking_id:
            queryset = queryset.exclude(pk=exclude_booking_id)
        return list(queryset)
