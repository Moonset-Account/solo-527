from django.db.models import Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta
from .models import Ticket, TicketHistory, TicketNote
from apps.accounts.models import User


class TicketService:
    @staticmethod
    def create_ticket(data, creator):
        sla_hours = TicketService._get_sla_hours(data.get('priority', 'medium'))
        sla_deadline = timezone.now() + timedelta(hours=sla_hours)
        data['sla_deadline'] = sla_deadline
        data['creator'] = creator
        data['created_by'] = creator
        return Ticket.objects.create(**data)

    @staticmethod
    def _get_sla_hours(priority):
        sla_map = {
            'urgent': 2,
            'high': 8,
            'medium': 24,
            'low': 72,
        }
        return sla_map.get(priority, 24)

    @staticmethod
    def assign_ticket(ticket, assignee_id, actor):
        assignee = User.objects.get(id=assignee_id)
        old_assignee = ticket.assignee
        ticket.assignee = assignee
        if ticket.status == Ticket.Status.PENDING:
            ticket.status = Ticket.Status.PROCESSING
        ticket.save()

        TicketHistory.objects.create(
            ticket=ticket,
            actor=actor,
            action='分派工单',
            description=f'工单由 {old_assignee.username if old_assignee else "未分派"} 分派给 {assignee.username}',
            field_name='assignee',
            old_value=str(old_assignee.id) if old_assignee else '',
            new_value=str(assignee.id),
            created_by=actor,
            updated_by=actor,
        )
        return ticket

    @staticmethod
    def escalate_ticket(ticket, escalated_to_id, reason, actor):
        escalated_to = User.objects.get(id=escalated_to_id)
        ticket.escalated_to = escalated_to
        ticket.escalation_reason = reason
        ticket.escalated_at = timezone.now()
        ticket.status = Ticket.Status.ESCALATED
        ticket.save()

        TicketHistory.objects.create(
            ticket=ticket,
            actor=actor,
            action='升级工单',
            description=f'升级原因: {reason}',
            field_name='status',
            old_value=ticket.get_status_display(),
            new_value='已升级',
            created_by=actor,
            updated_by=actor,
        )
        return ticket

    @staticmethod
    def resolve_ticket(ticket, resolution, status, actor):
        ticket.resolution = resolution
        ticket.resolved_at = timezone.now()
        if status == 'closed':
            ticket.status = Ticket.Status.CLOSED
            ticket.closed_at = timezone.now()
        else:
            ticket.status = Ticket.Status.RESOLVED
        ticket.save()

        TicketHistory.objects.create(
            ticket=ticket,
            actor=actor,
            action='完结工单',
            description=f'处理结果: {resolution}',
            field_name='status',
            old_value=ticket.get_status_display(),
            new_value='已关闭' if status == 'closed' else '已解决',
            created_by=actor,
            updated_by=actor,
        )
        return ticket

    @staticmethod
    def add_note(ticket, content, is_internal, actor):
        note = TicketNote.objects.create(
            ticket=ticket,
            content=content,
            is_internal=is_internal,
            created_by=actor,
            updated_by=actor,
        )

        if not ticket.first_response_at and not is_internal:
            ticket.first_response_at = timezone.now()
            ticket.save()

        TicketHistory.objects.create(
            ticket=ticket,
            actor=actor,
            action='添加备注',
            description=content[:200],
            field_name='note',
            new_value=content[:50],
            created_by=actor,
            updated_by=actor,
        )
        return note

    @staticmethod
    def get_dashboard_stats():
        now = timezone.now()
        today = now.date()
        tomorrow = today + timedelta(days=1)
        three_days_later = today + timedelta(days=3)

        todo_total = Ticket.objects.filter(
            status__in=[Ticket.Status.PENDING, Ticket.Status.PROCESSING, Ticket.Status.ESCALATED]
        ).count()
        todo_urgent = Ticket.objects.filter(
            status__in=[Ticket.Status.PENDING, Ticket.Status.PROCESSING, Ticket.Status.ESCALATED],
            priority=Ticket.Priority.URGENT
        ).count()
        todo_due_soon = Ticket.objects.filter(
            status__in=[Ticket.Status.PENDING, Ticket.Status.PROCESSING, Ticket.Status.ESCALATED],
            sla_deadline__gte=now,
            sla_deadline__lt=three_days_later
        ).count()

        exception_overdue = Ticket.objects.filter(
            status__in=[Ticket.Status.PENDING, Ticket.Status.PROCESSING, Ticket.Status.ESCALATED],
            sla_deadline__lt=now
        ).count()
        exception_escalated_no_response = Ticket.objects.filter(
            status=Ticket.Status.ESCALATED,
            escalated_at__isnull=False,
            first_response_at__isnull=True
        ).count()
        exception_repeated = Ticket.objects.filter(
            type=Ticket.Type.COMPLAINT,
            status__in=[Ticket.Status.PENDING, Ticket.Status.PROCESSING, Ticket.Status.ESCALATED]
        ).count()

        report_today = Ticket.objects.filter(created_at__date=today).count()
        report_today_resolved = Ticket.objects.filter(
            Q(resolved_at__date=today) | Q(closed_at__date=today)
        ).count()

        tickets_with_response = Ticket.objects.filter(first_response_at__isnull=False)
        avg_first_response = tickets_with_response.aggregate(
            avg=Avg(F('first_response_at') - F('created_at'))
        )['avg']
        avg_response_minutes = round(avg_first_response.total_seconds() / 60, 1) if avg_first_response else 0

        total_resolved = Ticket.objects.filter(
            status__in=[Ticket.Status.RESOLVED, Ticket.Status.CLOSED]
        ).count()
        total_all = Ticket.objects.count()
        resolution_rate = round((total_resolved / total_all * 100), 1) if total_all > 0 else 0

        return {
            'todo': {
                'total': todo_total,
                'urgent': todo_urgent,
                'due_soon': todo_due_soon,
            },
            'exceptions': {
                'overdue': exception_overdue,
                'escalated_no_response': exception_escalated_no_response,
                'repeated_complaints': exception_repeated,
            },
            'reports': {
                'today_tickets': report_today,
                'today_resolved': report_today_resolved,
                'avg_response_time': avg_response_minutes,
                'resolution_rate': resolution_rate,
            },
        }

    @staticmethod
    def get_queryset_with_related():
        return Ticket.objects.select_related(
            'assignee', 'creator', 'escalated_to'
        ).prefetch_related(
            'notes', 'history'
        ).annotate(
            notes_count=Count('notes')
        )


class TicketHistoryService:
    @staticmethod
    def create_history(ticket, actor, action, description='', field_name='', old_value='', new_value=''):
        return TicketHistory.objects.create(
            ticket=ticket,
            actor=actor,
            action=action,
            description=description,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
            created_by=actor,
            updated_by=actor,
        )
