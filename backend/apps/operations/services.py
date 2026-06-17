from django.db.models import Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta
from .models import QualityCheck, ImprovementAction, ExportRecord
from apps.tickets.models import Ticket
from apps.accounts.models import User
import hashlib


class QualityCheckService:
    @staticmethod
    def create_quality_check(ticket_id, checker_id, check_items=None, created_by=None):
        ticket = Ticket.objects.get(id=ticket_id)
        checker = User.objects.get(id=checker_id)
        return QualityCheck.objects.create(
            ticket=ticket,
            checker=checker,
            check_items=check_items or {},
            created_by=created_by or checker,
            updated_by=created_by or checker,
        )

    @staticmethod
    def start_check(quality_check, checker):
        quality_check.status = QualityCheck.Status.CHECKING
        quality_check.checker = checker
        quality_check.checked_at = timezone.now()
        quality_check.save(update_fields=['status', 'checker', 'checked_at', 'updated_at', 'updated_by'])
        return quality_check

    @staticmethod
    def pass_check(quality_check, score=None, comments='', checked_by=None):
        quality_check.status = QualityCheck.Status.PASSED
        quality_check.score = score or 100
        quality_check.comments = comments
        quality_check.checked_at = timezone.now()
        if checked_by:
            quality_check.checker = checked_by
        quality_check.save()
        return quality_check

    @staticmethod
    def fail_check(quality_check, score=None, comments='', issues_found='', suggestions='', create_improvement=False, checked_by=None):
        quality_check.status = QualityCheck.Status.FAILED
        quality_check.score = score or 0
        quality_check.comments = comments
        quality_check.issues_found = issues_found
        quality_check.suggestions = suggestions
        quality_check.checked_at = timezone.now()
        if checked_by:
            quality_check.checker = checked_by
        quality_check.save()

        if create_improvement and issues_found:
            ImprovementActionService.create_improvement_action(
                title=f'工单{quality_check.ticket.ticket_no}质检问题改进',
                description=issues_found,
                assignee_id=quality_check.ticket.assignee_id or checked_by.id if checked_by else None,
                quality_check_id=quality_check.id,
                related_ticket_id=quality_check.ticket.id,
                created_by=checked_by or quality_check.checker,
            )
        return quality_check

    @staticmethod
    def get_ticket_quality_checks(ticket_id):
        return QualityCheck.objects.filter(ticket_id=ticket_id).order_by('-created_at')

    @staticmethod
    def get_checker_stats(checker_id, days=30):
        date_from = timezone.now() - timedelta(days=days)
        checks = QualityCheck.objects.filter(
            checker_id=checker_id,
            created_at__gte=date_from
        )
        return {
            'total': checks.count(),
            'passed': checks.filter(status='passed').count(),
            'failed': checks.filter(status='failed').count(),
            'avg_score': checks.aggregate(avg=Avg('score'))['avg'] or 0,
        }


class ImprovementActionService:
    @staticmethod
    def create_improvement_action(title, description, assignee_id, priority='medium',
                                   due_date=None, quality_check_id=None, related_ticket_id=None,
                                   created_by=None):
        from django.utils import timezone
        from datetime import timedelta

        assignee = User.objects.get(id=assignee_id)
        if not due_date:
            due_date = (timezone.now() + timedelta(days=7)).date()

        data = {
            'title': title,
            'description': description,
            'assignee': assignee,
            'priority': priority,
            'due_date': due_date,
            'created_by': created_by or assignee,
            'updated_by': created_by or assignee,
        }
        if quality_check_id:
            data['quality_check_id'] = quality_check_id
        if related_ticket_id:
            data['related_ticket_id'] = related_ticket_id

        return ImprovementAction.objects.create(**data)

    @staticmethod
    def start_action(action, actor):
        action.status = ImprovementAction.Status.IN_PROGRESS
        action.save(update_fields=['status', 'updated_at', 'updated_by'])
        return action

    @staticmethod
    def complete_action(action, result='', progress=100, actor=None):
        action.status = ImprovementAction.Status.COMPLETED
        action.result = result
        action.progress = progress
        action.completed_at = timezone.now()
        action.save()
        return action

    @staticmethod
    def cancel_action(action, actor=None):
        action.status = ImprovementAction.Status.CANCELLED
        action.save(update_fields=['status', 'updated_at', 'updated_by'])
        return action

    @staticmethod
    def update_progress(action, progress, actor=None):
        action.progress = progress
        if progress >= 100:
            action.status = ImprovementAction.Status.COMPLETED
            action.completed_at = timezone.now()
        action.save()
        return action

    @staticmethod
    def get_overdue_actions():
        today = timezone.now().date()
        return ImprovementAction.objects.filter(
            status__in=['pending', 'in_progress'],
            due_date__lt=today
        ).order_by('due_date')

    @staticmethod
    def get_assignee_stats(assignee_id, days=30):
        date_from = timezone.now() - timedelta(days=days)
        actions = ImprovementAction.objects.filter(
            assignee_id=assignee_id,
            created_at__gte=date_from
        )
        return {
            'total': actions.count(),
            'pending': actions.filter(status='pending').count(),
            'in_progress': actions.filter(status='in_progress').count(),
            'completed': actions.filter(status='completed').count(),
            'cancelled': actions.filter(status='cancelled').count(),
            'overdue': actions.filter(
                status__in=['pending', 'in_progress'],
                due_date__lt=timezone.now().date()
            ).count(),
            'avg_progress': actions.aggregate(avg=Avg('progress'))['avg'] or 0,
        }


class ExportRecordService:
    @staticmethod
    def calculate_filter_hash(filters, export_type):
        filter_str = f"{export_type}:{str(sorted(filters.items()))}"
        return hashlib.sha256(filter_str.encode('utf-8')).hexdigest()

    @staticmethod
    def check_duplicate(export_type, filters):
        filter_hash = ExportRecordService.calculate_filter_hash(filters, export_type)
        existing = ExportRecord.objects.filter(
            filter_hash=filter_hash,
            status__in=['pending', 'processing', 'completed']
        ).order_by('-created_at').first()

        if existing:
            return {
                'is_duplicate': True,
                'existing_id': existing.id,
                'existing_file': existing.file_name,
                'existing_status': existing.status,
                'existing_created_at': existing.created_at,
            }
        return {'is_duplicate': False}

    @staticmethod
    def create_export(export_type, filters, file_name, created_by):
        filter_hash = ExportRecordService.calculate_filter_hash(filters, export_type)
        previous_export = ExportRecord.objects.filter(
            filter_hash=filter_hash,
            status='completed'
        ).order_by('-created_at').first()

        return ExportRecord.objects.create(
            export_type=export_type,
            filters=filters,
            filter_hash=filter_hash,
            file_name=file_name,
            created_by=created_by,
            previous_export=previous_export,
            updated_by=created_by,
        )

    @staticmethod
    def start_export(export_record):
        export_record.status = ExportRecord.Status.PROCESSING
        export_record.started_at = timezone.now()
        export_record.save(update_fields=['status', 'started_at', 'updated_at', 'updated_by'])
        return export_record

    @staticmethod
    def complete_export(export_record, file_path, file_size, record_count):
        export_record.status = ExportRecord.Status.COMPLETED
        export_record.file_path = file_path
        export_record.file_size = file_size
        export_record.record_count = record_count
        export_record.completed_at = timezone.now()
        export_record.save()
        return export_record

    @staticmethod
    def fail_export(export_record, error_message):
        export_record.status = ExportRecord.Status.FAILED
        export_record.error_message = error_message
        export_record.completed_at = timezone.now()
        export_record.save()
        return export_record

    @staticmethod
    def get_user_exports(user_id, export_type=None):
        queryset = ExportRecord.objects.filter(created_by_id=user_id)
        if export_type:
            queryset = queryset.filter(export_type=export_type)
        return queryset.order_by('-created_at')


class ServiceTicketService:
    @staticmethod
    def filter_service_tickets(filters=None):
        queryset = Ticket.objects.select_related(
            'assignee', 'creator', 'escalated_to'
        ).all()

        if filters:
            if filters.get('status'):
                queryset = queryset.filter(status=filters['status'])
            if filters.get('type'):
                queryset = queryset.filter(type=filters['type'])
            if filters.get('priority'):
                queryset = queryset.filter(priority=filters['priority'])
            if filters.get('assignee_id'):
                queryset = queryset.filter(assignee_id=filters['assignee_id'])
            if filters.get('creator_id'):
                queryset = queryset.filter(creator_id=filters['creator_id'])
            if filters.get('date_from'):
                queryset = queryset.filter(created_at__date__gte=filters['date_from'])
            if filters.get('date_to'):
                queryset = queryset.filter(created_at__date__lte=filters['date_to'])
            if filters.get('keyword'):
                keyword = filters['keyword']
                queryset = queryset.filter(
                    Q(title__icontains=keyword) |
                    Q(description__icontains=keyword) |
                    Q(ticket_no__icontains=keyword) |
                    Q(customer_name__icontains=keyword) |
                    Q(order_no__icontains=keyword)
                )
            if filters.get('is_overdue'):
                queryset = queryset.filter(
                    sla_deadline__lt=timezone.now(),
                    status__in=['pending', 'processing', 'escalated']
                )

        return queryset.order_by('-created_at')
