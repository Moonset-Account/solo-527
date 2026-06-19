from django.utils import timezone
from django.db import models
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task, TaskProcessRecord
from .serializers import (
    TaskSerializer, TaskDetailSerializer,
    TaskProcessRecordSerializer, TaskStatusUpdateSerializer
)
from common.views import BaseViewSet
from common.permissions import IsRepresentative
from common.utils import generate_excel_response


class TaskViewSet(BaseViewSet):
    queryset = Task.objects.select_related(
        'assigned_to', 'related_resident', 'related_resident__user'
    ).prefetch_related('process_records').all()
    serializer_class = TaskSerializer
    search_fields = ['title', 'description', 'assigned_to__first_name']
    filterset_fields = [
        'type', 'priority', 'status', 'assigned_to',
        'community', 'source', 'related_resident'
    ]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TaskDetailSerializer
        return TaskSerializer

    def perform_create(self, serializer):
        task = serializer.save(created_by=self.request.user)
        from .services import auto_assign_task
        if not task.assigned_to:
            auto_assign_task(task)

    @action(detail=True, methods=['get', 'post'], permission_classes=[IsRepresentative])
    def process_records(self, request, pk=None):
        task = self.get_object()
        if request.method == 'GET':
            records = TaskProcessRecord.objects.filter(
                task=task
            ).select_related('processed_by').order_by('-processed_at')
            page = self.paginate_queryset(records)
            if page is not None:
                serializer = TaskProcessRecordSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = TaskProcessRecordSerializer(records, many=True)
            return Response(serializer.data)
        
        from .serializers import TaskProcessCreateSerializer
        serializer = TaskProcessCreateSerializer(data=request.data)
        if serializer.is_valid():
            record = TaskProcessRecord.objects.create(
                task=task,
                content=serializer.validated_data['content'],
                remark=serializer.validated_data.get('remark', ''),
                processed_by=request.user
            )
            return Response(
                TaskProcessRecordSerializer(record).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        task = self.get_object()
        if task.status != 'pending':
            return Response(
                {'error': '该任务状态不允许开始'},
                status=status.HTTP_400_BAD_REQUEST
            )
        task.start(request.user)
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        if task.status not in ['pending', 'in_progress']:
            return Response(
                {'error': '该任务状态不允许完成'},
                status=status.HTTP_400_BAD_REQUEST
            )
        remark = request.data.get('remark', '')
        task.complete(request.user, remark)
        return Response(TaskSerializer(task).data)

    @action(detail=True, methods=['post'], permission_classes=[IsRepresentative])
    def assign(self, request, pk=None):
        task = self.get_object()
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': '请指定负责人'},
                status=status.HTTP_400_BAD_REQUEST
            )
        from users.models import User
        try:
            user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return Response(
                {'error': '指定的用户不存在'},
                status=status.HTTP_400_BAD_REQUEST
            )
        task.assigned_to = user
        task.save()

        TaskProcessRecord.objects.create(
            task=task,
            content=f'已分配给 {user.get_full_name()}',
            processed_by=request.user
        )

        from notifications.services import create_notification
        create_notification(
            user=user,
            title='新的任务分配',
            content=f'您有新的待办任务：{task.title}',
            type='todo',
            related_id=task.id
        )

        return Response({'message': '分配成功'})

    @action(detail=True, methods=['post'], permission_classes=[IsRepresentative])
    def update_status(self, request, pk=None):
        task = self.get_object()
        serializer = TaskStatusUpdateSerializer(data=request.data)
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

            if new_status == 'completed':
                task.completed_at = timezone.now()

            task.save()

            TaskProcessRecord.objects.create(
                task=task,
                content=f'状态从 {task.get_status_display()} 变更为 {task.get_status_display()}',
                remark=serializer.validated_data.get('remark', ''),
                processed_by=request.user,
                status_change=new_status
            )

            return Response(TaskSerializer(task).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_process_record(self, request, pk=None):
        task = self.get_object()
        content = request.data.get('content', '')
        remark = request.data.get('remark', '')
        if not content:
            return Response(
                {'error': '请填写处理内容'},
                status=status.HTTP_400_BAD_REQUEST
            )

        record = TaskProcessRecord.objects.create(
            task=task,
            content=content,
            remark=remark,
            processed_by=request.user
        )
        return Response(
            TaskProcessRecordSerializer(record).data,
            status=status.HTTP_201_CREATED
        )

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
    def my_created(self, request):
        queryset = self.get_queryset().filter(created_by=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def exception_tasks(self, request):
        queryset = self.get_queryset().filter(type='qualification_exception')
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
            'title', 'type', 'priority', 'status',
            'assigned_to__first_name', 'created_by__first_name',
            'created_at', 'deadline', 'completed_at', 'community'
        ]
        return generate_excel_response(queryset, fields, '待办任务')

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        queryset = self.get_queryset()
        total = queryset.count()
        pending = queryset.filter(status='pending').count()
        in_progress = queryset.filter(status='in_progress').count()
        completed = queryset.filter(status='completed').count()
        by_type = queryset.values('type').annotate(count=models.Count('id'))
        by_priority = queryset.values('priority').annotate(count=models.Count('id'))
        by_assignee = queryset.filter(assigned_to__isnull=False).values(
            'assigned_to__first_name', 'assigned_to__last_name'
        ).annotate(count=models.Count('id'))
        return Response({
            'total': total,
            'pending': pending,
            'in_progress': in_progress,
            'completed': completed,
            'by_type': list(by_type),
            'by_priority': list(by_priority),
            'by_assignee': list(by_assignee)
        })

    @action(detail=False, methods=['get'])
    def kanban(self, request):
        queryset = self.get_queryset()
        if request.user.role == 'volunteer':
            queryset = queryset.filter(assigned_to=request.user)

        def format_tasks(tasks):
            result = []
            for task in tasks:
                assigned_to_name = ''
                if task.get('assigned_to__first_name') or task.get('assigned_to__last_name'):
                    assigned_to_name = f"{task.get('assigned_to__first_name', '')} {task.get('assigned_to__last_name', '')}".strip()
                
                resident_name = ''
                if task.get('related_resident__user__first_name') or task.get('related_resident__user__last_name'):
                    resident_name = f"{task.get('related_resident__user__first_name', '')} {task.get('related_resident__user__last_name', '')}".strip()
                
                result.append({
                    'id': task['id'],
                    'title': task['title'],
                    'type': task['type'],
                    'priority': task['priority'],
                    'created_at': task['created_at'],
                    'completed_at': task.get('completed_at'),
                    'assigned_to_name': assigned_to_name,
                    'resident_name': resident_name,
                    'status_display': dict(Task.STATUS_CHOICES).get(task.get('status', 'pending'), '待处理'),
                    'type_display': dict(Task.TYPE_CHOICES).get(task.get('type', ''), task.get('type', '')),
                    'priority_display': dict(Task.PRIORITY_CHOICES).get(task.get('priority', 'medium'), '中'),
                })
            return result

        columns = {
            'todo': format_tasks(queryset.filter(status='pending').values(
                'id', 'title', 'type', 'priority', 'status', 'created_at',
                'assigned_to__first_name', 'assigned_to__last_name',
                'related_resident__user__first_name', 'related_resident__user__last_name'
            )),
            'in_progress': format_tasks(queryset.filter(status='in_progress').values(
                'id', 'title', 'type', 'priority', 'status', 'created_at',
                'assigned_to__first_name', 'assigned_to__last_name',
                'related_resident__user__first_name', 'related_resident__user__last_name'
            )),
            'done': format_tasks(queryset.filter(status='completed').values(
                'id', 'title', 'type', 'priority', 'status', 'created_at', 'completed_at',
                'assigned_to__first_name', 'assigned_to__last_name',
                'related_resident__user__first_name', 'related_resident__user__last_name'
            )),
        }
        return Response(columns)
