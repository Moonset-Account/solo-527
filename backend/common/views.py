from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.conf import settings
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
