from typing import Dict, Any, Optional, List
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from core.services import BaseService
from core.validators import BaseValidator
from core.models import User
from .models import FaultTicket, FaultAttachment, FaultComment, MaintenanceSchedule
from notifications.services import NotificationService


class FaultTicketValidator(BaseValidator):
    required_permission_create = 'maintenance.report'
    required_permission_update = 'maintenance.manage'
    required_permission_delete = 'maintenance.manage'


class FaultTicketService(BaseService[FaultTicket]):
    model = FaultTicket
    validator = FaultTicketValidator()

    def get_user_tickets(self, user_id: str, status: Optional[str] = None) -> List[FaultTicket]:
        queryset = self.get_queryset().filter(reporter_id=user_id)
        if status:
            queryset = queryset.filter(status=status)
        return list(queryset.select_related('equipment', 'assignee').order_by('-created_at'))

    def get_assignee_tickets(self, assignee_id: str, status: Optional[str] = None) -> List[FaultTicket]:
        queryset = self.get_queryset().filter(assignee_id=assignee_id)
        if status:
            queryset = queryset.filter(status=status)
        return list(queryset.select_related('equipment', 'reporter').order_by('-created_at'))

    def get_tickets_by_status(self, status: str) -> List[FaultTicket]:
        return list(
            self.get_queryset()
            .filter(status=status)
            .select_related('equipment', 'reporter', 'assignee')
            .order_by('-priority', '-created_at')
        )

    def get_open_tickets(self) -> List[FaultTicket]:
        return list(
            self.get_queryset()
            .filter(status__in=[FaultTicket.Status.OPEN, FaultTicket.Status.IN_PROGRESS, FaultTicket.Status.WAITING_PARTS])
            .select_related('equipment', 'reporter', 'assignee')
            .order_by('-priority', '-created_at')
        )

    @transaction.atomic
    def create(self, data: Dict[str, Any], **kwargs) -> FaultTicket:
        user = kwargs.get('user')
        if user and 'reporter' not in data:
            data['reporter'] = user
        if 'status' not in data:
            data['status'] = FaultTicket.Status.OPEN

        ticket = super().create(data, **kwargs)

        ticket.equipment.status = 'broken'
        ticket.equipment.save()

        return ticket

    @transaction.atomic
    def update_status(self, ticket: FaultTicket, status: str, user: User,
                      resolution: str = '') -> FaultTicket:
        if status not in dict(FaultTicket.Status.choices):
            raise ValidationError(f'无效的状态: {status}')

        ticket.status = status
        ticket.updated_by = user
        if resolution:
            ticket.resolution = resolution
        if status == FaultTicket.Status.RESOLVED:
            ticket.resolved_at = timezone.now()
            ticket.resolved_by = user
        ticket.save()

        if status == FaultTicket.Status.RESOLVED:
            ticket.equipment.status = 'available'
            ticket.equipment.save()

        notification_service = NotificationService(user)
        notification_service.send_fault_updated(ticket)

        return ticket

    @transaction.atomic
    def assign(self, ticket: FaultTicket, assignee: User, assigner: User) -> FaultTicket:
        ticket.assignee = assignee
        ticket.updated_by = assigner
        if ticket.status == FaultTicket.Status.OPEN:
            ticket.status = FaultTicket.Status.IN_PROGRESS
        ticket.save()
        return ticket

    @transaction.atomic
    def add_comment(self, ticket: FaultTicket, user: User, content: str,
                    is_internal: bool = False) -> FaultComment:
        return FaultComment.objects.create(
            ticket=ticket,
            user=user,
            content=content,
            is_internal=is_internal,
            created_by=user,
            updated_by=user,
        )

    @transaction.atomic
    def add_attachment(self, ticket: FaultTicket, user: User, file, file_name: str) -> FaultAttachment:
        return FaultAttachment.objects.create(
            ticket=ticket,
            file=file,
            file_name=file_name,
            uploaded_by=user,
        )


class MaintenanceScheduleService(BaseService[MaintenanceSchedule]):
    model = MaintenanceSchedule

    def get_equipment_schedules(self, equipment_id: str, completed: Optional[bool] = None) -> List[MaintenanceSchedule]:
        queryset = self.get_queryset().filter(equipment_id=equipment_id)
        if completed is not None:
            queryset = queryset.filter(is_completed=completed)
        return list(queryset.order_by('scheduled_date'))

    def get_upcoming_schedules(self, days: int = 30) -> List[MaintenanceSchedule]:
        from datetime import timedelta
        end_date = timezone.now().date() + timedelta(days=days)
        return list(
            self.get_queryset()
            .filter(is_completed=False, scheduled_date__lte=end_date)
            .select_related('equipment')
            .order_by('scheduled_date')
        )

    @transaction.atomic
    def complete(self, schedule: MaintenanceSchedule, user: User, notes: str = '') -> MaintenanceSchedule:
        if schedule.is_completed:
            raise ValidationError('该维护计划已完成')

        schedule.is_completed = True
        schedule.performed_date = timezone.now().date()
        schedule.performed_by = user
        schedule.updated_by = user
        if notes:
            schedule.notes = notes
        schedule.save()

        schedule.equipment.last_maintenance_date = timezone.now().date()
        schedule.equipment.save()

        return schedule
