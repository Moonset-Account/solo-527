from typing import Dict, Any, Optional, List
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from core.services import BaseService
from core.validators import BaseValidator
from core.models import User
from .models import SafetyIncident, SafetyAttachment, SafetyInspection, SafetyTrainingRecord
from notifications.services import NotificationService


class SafetyIncidentValidator(BaseValidator):
    required_permission_create = 'safety.report'
    required_permission_update = 'safety.manage'
    required_permission_delete = 'safety.manage'


class SafetyIncidentService(BaseService[SafetyIncident]):
    model = SafetyIncident
    validator = SafetyIncidentValidator()

    def get_user_incidents(self, user_id: str, status: Optional[str] = None) -> List[SafetyIncident]:
        queryset = self.get_queryset().filter(reporter_id=user_id)
        if status:
            queryset = queryset.filter(status=status)
        return list(queryset.select_related('equipment').order_by('-incident_time'))

    def get_incidents_by_severity(self, severity: str) -> List[SafetyIncident]:
        return list(
            self.get_queryset()
            .filter(severity=severity)
            .select_related('reporter', 'equipment')
            .order_by('-incident_time')
        )

    def get_open_incidents(self) -> List[SafetyIncident]:
        return list(
            self.get_queryset()
            .filter(status__in=[SafetyIncident.Status.REPORTED, SafetyIncident.Status.INVESTIGATING])
            .select_related('reporter', 'equipment')
            .order_by('-severity', '-incident_time')
        )

    @transaction.atomic
    def create(self, data: Dict[str, Any], **kwargs) -> SafetyIncident:
        user = kwargs.get('user')
        if user and 'reporter' not in data:
            data['reporter'] = user
        if 'status' not in data:
            data['status'] = SafetyIncident.Status.REPORTED

        return super().create(data, **kwargs)

    @transaction.atomic
    def update_status(self, incident: SafetyIncident, status: str, user: User,
                      notes: Dict[str, str] = None) -> SafetyIncident:
        if status not in dict(SafetyIncident.Status.choices):
            raise ValidationError(f'无效的状态: {status}')

        incident.status = status
        incident.updated_by = user

        if notes:
            if 'root_cause' in notes:
                incident.root_cause = notes['root_cause']
            if 'corrective_actions' in notes:
                incident.corrective_actions = notes['corrective_actions']
            if 'preventive_measures' in notes:
                incident.preventive_measures = notes['preventive_measures']

        if status == SafetyIncident.Status.INVESTIGATING:
            incident.investigated_by = user
        elif status == SafetyIncident.Status.RESOLVED:
            incident.resolved_at = timezone.now()
        elif status == SafetyIncident.Status.CLOSED:
            incident.closed_at = timezone.now()

        incident.save()

        notification_service = NotificationService(user)
        notification_service.send_safety_incident_updated(incident)

        return incident

    @transaction.atomic
    def add_attachment(self, incident: SafetyIncident, user: User, file, file_name: str) -> SafetyAttachment:
        return SafetyAttachment.objects.create(
            incident=incident,
            file=file,
            file_name=file_name,
            uploaded_by=user,
        )


class SafetyInspectionService(BaseService[SafetyInspection]):
    model = SafetyInspection

    def get_upcoming_inspections(self, days: int = 30) -> List[SafetyInspection]:
        from datetime import timedelta
        end_date = timezone.now().date() + timedelta(days=days)
        return list(
            self.get_queryset()
            .filter(status__in=[SafetyInspection.Status.SCHEDULED, SafetyInspection.Status.IN_PROGRESS])
            .filter(scheduled_date__lte=end_date)
            .select_related('performed_by')
            .order_by('scheduled_date')
        )

    @transaction.atomic
    def complete(self, inspection: SafetyInspection, user: User, findings: str = '',
                 recommendations: str = '') -> SafetyInspection:
        if inspection.status == SafetyInspection.Status.COMPLETED:
            raise ValidationError('该检查已完成')

        inspection.status = SafetyInspection.Status.COMPLETED
        inspection.performed_date = timezone.now().date()
        inspection.performed_by = user
        inspection.updated_by = user
        if findings:
            inspection.findings = findings
        if recommendations:
            inspection.recommendations = recommendations
        inspection.save()

        return inspection


class SafetyTrainingRecordService(BaseService[SafetyTrainingRecord]):
    model = SafetyTrainingRecord

    def get_user_records(self, user_id: str) -> List[SafetyTrainingRecord]:
        return list(
            self.get_queryset()
            .filter(user_id=user_id)
            .order_by('-training_date')
        )

    def get_expiring_certificates(self, days: int = 30) -> List[SafetyTrainingRecord]:
        from datetime import timedelta
        end_date = timezone.now().date() + timedelta(days=days)
        return list(
            self.get_queryset()
            .filter(expiry_date__lte=end_date, expiry_date__isnull=False)
            .select_related('user')
            .order_by('expiry_date')
        )
