from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.conf import settings
from django.utils import timezone
from .permissions import IsProductionData
from .utils import export_to_excel


class BaseViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    permission_classes = [IsProductionData]

    def get_queryset(self):
        queryset = super().get_queryset()
        if settings.IS_PRODUCTION:
            queryset = queryset.filter(is_test_data=False)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def statistics_view(request):
    from residents.models import Resident
    from topics.models import Topic
    from patrol.models import PatrolTask
    from assistance.models import AssistanceDemand
    from tasks.models import Task
    from voting.models import Vote
    from django.db.models import Q

    resident_count = Resident.objects.all().count()
    pending_topics = Topic.objects.filter(status__in=['draft', 'pending_review']).count()
    active_patrols = PatrolTask.objects.filter(status='in_progress').count()
    pending_assistance = AssistanceDemand.objects.filter(status__in=['pending', 'accepted']).count()
    pending_tasks = Task.objects.filter(status='pending').count()
    qualification_exceptions = Vote.objects.filter(
        has_qualification_exception=True,
        exception_handled=False
    ).count()

    return Response({
        'resident_count': resident_count,
        'pending_topics': pending_topics,
        'active_patrols': active_patrols,
        'pending_assistance': pending_assistance,
        'pending_tasks': pending_tasks,
        'qualification_exceptions': qualification_exceptions,
        'voting_topics': Topic.objects.filter(status='voting').count(),
        'completed_tasks_today': Task.objects.filter(
            status='completed',
            completed_at__date=timezone.now().date()
        ).count(),
        'is_production': settings.IS_PRODUCTION,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def environment_info(request):
    return Response({
        'environment': 'production' if settings.IS_PRODUCTION else 'development',
        'is_production': settings.IS_PRODUCTION,
        'is_test_data_visible': not settings.IS_PRODUCTION,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def DataExportView(request):
    module = request.data.get('module')
    filters = request.data.get('filters', {})
    fields = request.data.get('fields')

    module_mapping = {
        'residents': 'residents.models.Resident',
        'topics': 'topics.models.Topic',
        'voting': 'voting.models.Vote',
        'patrol': 'patrol.models.PatrolTask',
        'assistance': 'assistance.models.AssistanceDemand',
        'tasks': 'tasks.models.Task',
        'volunteers': 'volunteers.models.Volunteer',
        'patrol_checkins': 'patrol.models.PatrolCheckIn',
        'assistance_progress': 'assistance.models.AssistanceProgress',
        'volunteer_assignments': 'volunteers.models.VolunteerAssignment',
    }

    if module not in module_mapping:
        return Response(
            {'error': '不支持的导出模块'},
            status=status.HTTP_400_BAD_REQUEST
        )

    from django.apps import apps
    model_path = module_mapping[module]
    app_label, model_name = model_path.rsplit('.', 1)
    ModelClass = apps.get_model(app_label, model_name.split('.')[-1])

    queryset = ModelClass.objects.all()
    if settings.IS_PRODUCTION:
        queryset = queryset.filter(is_test_data=False)

    for key, value in filters.items():
        if value:
            queryset = queryset.filter(**{key: value})

    if not fields:
        fields = [field.name for field in ModelClass._meta.fields]

    data = list(queryset.values(*fields))
    return export_to_excel(data, f'{module}_export')
