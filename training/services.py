from typing import Dict, Any, Optional, List
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone
from core.services import BaseService
from core.validators import BaseValidator
from core.models import User
from .models import (
    TrainingCourse, TrainingSession, TrainingApplication,
    TrainingCertification
)
from equipment.models import EquipmentCategory
from notifications.services import NotificationService
import uuid


class TrainingCourseValidator(BaseValidator):
    required_permission_create = 'training.manage'
    required_permission_update = 'training.manage'
    required_permission_delete = 'training.manage'


class TrainingApplicationValidator(BaseValidator):
    required_permission_create = 'training.apply'
    required_permission_update = 'training.manage'
    required_permission_delete = 'training.manage'


class TrainingCertificationValidator(BaseValidator):
    required_permission_create = 'training.certify'
    required_permission_update = 'training.certify'
    required_permission_delete = 'training.certify'


class TrainingCourseService(BaseService[TrainingCourse]):
    model = TrainingCourse
    validator = TrainingCourseValidator()

    def get_published_courses(self, category_id: Optional[str] = None) -> List[TrainingCourse]:
        queryset = self.get_queryset().filter(status=TrainingCourse.Status.PUBLISHED)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return list(queryset.select_related('category'))


class TrainingSessionService(BaseService[TrainingSession]):
    model = TrainingSession

    def get_upcoming_sessions(self, course_id: Optional[str] = None) -> List[TrainingSession]:
        queryset = self.get_queryset().filter(
            start_time__gte=timezone.now(),
            course__status=TrainingCourse.Status.PUBLISHED
        )
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return list(queryset.select_related('course', 'trainer').order_by('start_time'))

    def get_user_sessions(self, user_id: str) -> List[TrainingSession]:
        return list(
            self.get_queryset()
            .filter(applications__user_id=user_id)
            .select_related('course', 'trainer')
            .order_by('-start_time')
        )


class TrainingApplicationService(BaseService[TrainingApplication]):
    model = TrainingApplication
    validator = TrainingApplicationValidator()

    def get_user_applications(self, user_id: str, status: Optional[str] = None) -> List[TrainingApplication]:
        queryset = self.get_queryset().filter(user_id=user_id)
        if status:
            queryset = queryset.filter(status=status)
        return list(queryset.select_related('session', 'session__course').order_by('-created_at'))

    def get_pending_applications(self, session_id: Optional[str] = None) -> List[TrainingApplication]:
        queryset = self.get_queryset().filter(status=TrainingApplication.Status.PENDING)
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        return list(queryset.select_related('user', 'session', 'session__course'))

    @transaction.atomic
    def apply(self, session: TrainingSession, user: User, notes: str = '') -> TrainingApplication:
        if session.is_full:
            raise ValidationError('该培训场次已满员')

        existing = TrainingApplication.objects.filter(
            session=session,
            user=user
        ).first()
        if existing:
            raise ValidationError('您已申请该培训场次')

        application = self.create({
            'session': session,
            'user': user,
            'application_notes': notes,
            'status': TrainingApplication.Status.PENDING,
        }, user=user)

        return application

    @transaction.atomic
    def approve(self, application: TrainingApplication, reviewer: User, notes: str = '') -> TrainingApplication:
        if application.status != TrainingApplication.Status.PENDING:
            raise ValidationError('只有待审核的申请可以审批')

        application.status = TrainingApplication.Status.APPROVED
        application.reviewed_by = reviewer
        application.reviewed_at = timezone.now()
        application.review_notes = notes
        application.updated_by = reviewer
        application.save()

        application.session.current_participants += 1
        application.session.save()

        notification_service = NotificationService(reviewer)
        notification_service.send_training_approved(application)

        return application

    @transaction.atomic
    def reject(self, application: TrainingApplication, reviewer: User, notes: str = '') -> TrainingApplication:
        if application.status != TrainingApplication.Status.PENDING:
            raise ValidationError('只有待审核的申请可以拒绝')

        application.status = TrainingApplication.Status.REJECTED
        application.reviewed_by = reviewer
        application.reviewed_at = timezone.now()
        application.review_notes = notes
        application.updated_by = reviewer
        application.save()

        notification_service = NotificationService(reviewer)
        notification_service.send_training_rejected(application)

        return application

    @transaction.atomic
    def cancel(self, application: TrainingApplication, user: User) -> TrainingApplication:
        if application.status not in [TrainingApplication.Status.PENDING, TrainingApplication.Status.APPROVED]:
            raise ValidationError('只有待审核或已通过的申请可以取消')

        if application.status == TrainingApplication.Status.APPROVED:
            application.session.current_participants -= 1
            application.session.save()

        application.status = TrainingApplication.Status.CANCELLED
        application.updated_by = user
        application.save()

        return application

    @transaction.atomic
    def complete(self, application: TrainingApplication, reviewer: User) -> TrainingApplication:
        if application.status != TrainingApplication.Status.APPROVED:
            raise ValidationError('只有已通过的申请可以标记为完成')

        application.status = TrainingApplication.Status.COMPLETED
        application.updated_by = reviewer
        application.save()

        return application


class TrainingCertificationService(BaseService[TrainingCertification]):
    model = TrainingCertification
    validator = TrainingCertificationValidator()

    def get_user_certifications(self, user_id: str, valid_only: bool = True) -> List[TrainingCertification]:
        queryset = self.get_queryset().filter(user_id=user_id)
        if valid_only:
            queryset = queryset.filter(status=TrainingCertification.Status.VALID)
        return list(queryset.select_related('course', 'category').order_by('-issued_date'))

    def has_valid_certification(self, user_id: str, category_id: str) -> bool:
        return self.get_queryset().filter(
            user_id=user_id,
            category_id=category_id,
            status=TrainingCertification.Status.VALID
        ).exists()

    @transaction.atomic
    def issue_certification(
        self,
        user: User,
        course: TrainingCourse,
        category: EquipmentCategory,
        issued_by: User,
        score: Optional[float] = None,
        notes: str = ''
    ) -> TrainingCertification:
        cert_number = f'CERT-{uuid.uuid4().hex[:8].upper()}'

        certification = self.create({
            'user': user,
            'course': course,
            'category': category,
            'issued_date': timezone.now().date(),
            'issued_by': issued_by,
            'certificate_number': cert_number,
            'score': score,
            'notes': notes,
            'status': TrainingCertification.Status.VALID,
        }, user=issued_by)

        notification_service = NotificationService(issued_by)
        notification_service.send_certification_issued(certification)

        return certification
