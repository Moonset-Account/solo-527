from django.db.models import Count
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import InspectionTemplate, InspectionItem, InspectionTask, InspectionResult
from .serializers import (
    InspectionTemplateListSerializer, InspectionTemplateDetailSerializer,
    InspectionItemSerializer,
    InspectionTaskListSerializer, InspectionTaskDetailSerializer,
    InspectionResultSerializer
)
from apps.viewsets import OrganizationScopedViewSet


class InspectionTemplateViewSet(OrganizationScopedViewSet):
    queryset = InspectionTemplate.objects.all()
    filterset_fields = ['is_active', 'is_enabled', 'template_type']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'created_at', 'template_type']

    def get_queryset(self):
        qs = super().get_queryset().annotate(
            item_count=Count('items'),
            items_count=Count('items'),
            task_count=Count('tasks')
        )
        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return InspectionTemplateDetailSerializer
        return InspectionTemplateListSerializer

    @action(detail=True, methods=['post'])
    def run(self, request, pk=None):
        template = self.get_object()
        task_code = f'IN{timezone.now().strftime("%Y%m%d%H%M%S")}'
        task = InspectionTask.objects.create(
            organization=request.user.organization,
            template=template,
            code=task_code,
            name=f'{template.name} - {timezone.now().strftime("%Y-%m-%d %H:%M")}',
            status=InspectionTask.STATUS_PENDING,
            trigger_type=InspectionTask.TRIGGER_MANUAL,
            triggered_by=request.user,
            created_by=request.user,
            updated_by=request.user
        )
        from .tasks import run_inspection_task
        run_inspection_task.delay(task.id)
        return Response(InspectionTaskDetailSerializer(task).data)


class InspectionItemViewSet(OrganizationScopedViewSet):
    queryset = InspectionItem.objects.all()
    serializer_class = InspectionItemSerializer
    filterset_fields = ['template', 'item_type']
    search_fields = ['name', 'metric']
    ordering_fields = ['sort_order', 'created_at']


class InspectionTaskViewSet(OrganizationScopedViewSet):
    queryset = InspectionTask.objects.all()
    filterset_fields = ['template', 'status', 'trigger_type']
    search_fields = ['code', 'name']
    ordering_fields = ['created_at', 'started_at', 'finished_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return InspectionTaskDetailSerializer
        return InspectionTaskListSerializer

    @action(detail=True, methods=['post'])
    def rerun(self, request, pk=None):
        task = self.get_object()
        new_task = InspectionTask.objects.create(
            organization=request.user.organization,
            template=task.template,
            code=f'IN{timezone.now().strftime("%Y%m%d%H%M%S")}',
            name=f'{task.name} - 重跑',
            status=InspectionTask.STATUS_PENDING,
            trigger_type=InspectionTask.TRIGGER_MANUAL,
            triggered_by=request.user,
            created_by=request.user,
            updated_by=request.user
        )
        from .tasks import run_inspection_task
        run_inspection_task.delay(new_task.id)
        return Response(InspectionTaskDetailSerializer(new_task).data)


class InspectionResultViewSet(OrganizationScopedViewSet):
    queryset = InspectionResult.objects.all()
    serializer_class = InspectionResultSerializer
    filterset_fields = ['task', 'item', 'server', 'status']
    search_fields = ['message']
    ordering_fields = ['checked_at']
