from django.db import models
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import PatrolRoute, PatrolTask, PatrolCheckIn, PatrolProcessRecord
from .serializers import (
    PatrolRouteSerializer, PatrolTaskSerializer, PatrolTaskDetailSerializer,
    PatrolCheckInSerializer, PatrolTaskStatusUpdateSerializer
)
from common.views import BaseViewSet
from common.permissions import IsRepresentative, IsVolunteer
from common.utils import generate_excel_response


class PatrolRouteViewSet(BaseViewSet):
    queryset = PatrolRoute.objects.all()
    serializer_class = PatrolRouteSerializer
    search_fields = ['name', 'description', 'community', 'start_point', 'end_point']
    filterset_fields = ['community', 'is_active']

    @action(detail=False, methods=['get'])
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        fields = ['name', 'description', 'community', 'start_point', 'end_point', 'estimated_duration', 'distance']
        return generate_excel_response(queryset, fields, '巡逻路线')


class PatrolTaskViewSet(BaseViewSet):
    queryset = PatrolTask.objects.select_related('route', 'assigned_to').prefetch_related('process_records', 'check_ins').all()
    serializer_class = PatrolTaskSerializer
    search_fields = ['title', 'description', 'community']
    filterset_fields = ['status', 'priority', 'community', 'assigned_to', 'route']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PatrolTaskDetailSerializer
        return PatrolTaskSerializer

    @action(detail=True, methods=['get', 'post'], permission_classes=[IsRepresentative])
    def process_records(self, request, pk=None):
        task = self.get_object()
        if request.method == 'GET':
            records = PatrolProcessRecord.objects.filter(
                task=task
            ).select_related('processed_by').order_by('-processed_at')
            page = self.paginate_queryset(records)
            if page is not None:
                from .serializers import PatrolProcessRecordSerializer
                serializer = PatrolProcessRecordSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            from .serializers import PatrolProcessRecordSerializer
            serializer = PatrolProcessRecordSerializer(records, many=True)
            return Response(serializer.data)
        
        from .serializers import PatrolProcessCreateSerializer
        serializer = PatrolProcessCreateSerializer(data=request.data)
        if serializer.is_valid():
            record = PatrolProcessRecord.objects.create(
                task=task,
                content=serializer.validated_data['content'],
                remark=serializer.validated_data.get('remark', ''),
                processed_by=request.user
            )
            from .serializers import PatrolProcessRecordSerializer
            return Response(
                PatrolProcessRecordSerializer(record).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsRepresentative])
    def assign(self, request, pk=None):
        task = self.get_object()
        volunteer_id = request.data.get('volunteer_id')
        if not volunteer_id:
            return Response(
                {'error': '请指定志愿者'},
                status=status.HTTP_400_BAD_REQUEST
            )
        from users.models import User
        try:
            volunteer = User.objects.get(id=volunteer_id, role__in=['volunteer', 'representative'])
        except User.DoesNotExist:
            return Response(
                {'error': '指定的志愿者不存在'},
                status=status.HTTP_400_BAD_REQUEST
            )
        task.assigned_to = volunteer
        task.status = 'assigned'
        task.save()

        PatrolProcessRecord.objects.create(
            task=task,
            content=f'已派发给志愿者 {volunteer.get_full_name()}',
            processed_by=request.user,
            status_change='assigned'
        )

        from notifications.services import create_notification
        create_notification(
            user=volunteer,
            title='新的巡逻任务',
            content=f'您有新的巡逻任务：{task.title}',
            type='patrol',
            related_id=task.id
        )

        return Response({'message': '派发成功'})

    @action(detail=True, methods=['post'], permission_classes=[IsVolunteer])
    def start(self, request, pk=None):
        task = self.get_object()
        if task.status not in ['pending', 'assigned']:
            return Response(
                {'error': '该任务状态不允许开始'},
                status=status.HTTP_400_BAD_REQUEST
            )
        task.start(request.user)
        return Response(PatrolTaskSerializer(task).data)

    @action(detail=True, methods=['post'], permission_classes=[IsVolunteer])
    def complete(self, request, pk=None):
        task = self.get_object()
        if task.status != 'in_progress':
            return Response(
                {'error': '该任务未在进行中'},
                status=status.HTTP_400_BAD_REQUEST
            )
        remark = request.data.get('remark', '')
        task.complete(request.user, remark)
        return Response(PatrolTaskSerializer(task).data)

    @action(detail=True, methods=['post'], permission_classes=[IsVolunteer])
    def check_in(self, request, pk=None):
        task = self.get_object()
        if task.status != 'in_progress':
            return Response(
                {'error': '该任务未在进行中'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = PatrolCheckInSerializer(data=request.data)
        if serializer.is_valid():
            check_in = PatrolCheckIn.objects.create(
                task=task,
                volunteer=request.user,
                checkpoint_name=serializer.validated_data['checkpoint_name'],
                location=serializer.validated_data['location'],
                latitude=serializer.validated_data.get('latitude'),
                longitude=serializer.validated_data.get('longitude'),
                photo=serializer.validated_data.get('photo'),
                remark=serializer.validated_data.get('remark', ''),
                has_issue=serializer.validated_data.get('has_issue', False),
                issue_description=serializer.validated_data.get('issue_description', ''),
                created_by=request.user
            )

            if check_in.has_issue:
                from tasks.models import Task
                from users.models import User
                Task.objects.create(
                    title=f'巡逻发现问题：{check_in.checkpoint_name}',
                    description=check_in.issue_description,
                    type='issue',
                    status='pending',
                    priority='high',
                    source='patrol',
                    source_id=check_in.id,
                    created_by=request.user
                )

            return Response(
                PatrolCheckInSerializer(check_in).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsRepresentative])
    def update_status(self, request, pk=None):
        task = self.get_object()
        serializer = PatrolTaskStatusUpdateSerializer(data=request.data)
        if serializer.is_valid():
            old_status = task.status
            new_status = serializer.validated_data['status']
            task.status = new_status

            if 'assigned_to_id' in serializer.validated_data:
                from users.models import User
                try:
                    task.assigned_to = User.objects.get(id=serializer.validated_data['assigned_to_id'])
                except User.DoesNotExist:
                    pass

            task.save()

            PatrolProcessRecord.objects.create(
                task=task,
                content=f'状态从 {task.get_status_display()} 变更为 {task.get_status_display()}',
                remark=serializer.validated_data.get('remark', ''),
                processed_by=request.user,
                status_change=new_status
            )

            return Response(PatrolTaskSerializer(task).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        queryset = self.get_queryset().filter(assigned_to=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        fields = [
            'title', 'description', 'status', 'priority',
            'assigned_to__first_name', 'route__name',
            'scheduled_start_time', 'scheduled_end_time',
            'actual_start_time', 'actual_end_time', 'community'
        ]
        return generate_excel_response(queryset, fields, '巡逻任务')

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        queryset = self.get_queryset()
        total = queryset.count()
        by_status = queryset.values('status').annotate(count=models.Count('id'))
        by_priority = queryset.values('priority').annotate(count=models.Count('id'))
        by_community = queryset.values('community').annotate(count=models.Count('id'))
        return Response({
            'total': total,
            'by_status': list(by_status),
            'by_priority': list(by_priority),
            'by_community': list(by_community)
        })


class PatrolCheckInViewSet(BaseViewSet):
    queryset = PatrolCheckIn.objects.select_related('task', 'volunteer').all()
    serializer_class = PatrolCheckInSerializer
    search_fields = ['checkpoint_name', 'location', 'volunteer__first_name', 'task__title']
    filterset_fields = ['task', 'volunteer', 'has_issue', 'check_in_time']
    http_method_names = ['get', 'list']

    @action(detail=False, methods=['get'])
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        fields = [
            'task__title', 'volunteer__first_name', 'checkpoint_name',
            'location', 'check_in_time', 'has_issue', 'issue_description'
        ]
        return generate_excel_response(queryset, fields, '巡逻签到')
