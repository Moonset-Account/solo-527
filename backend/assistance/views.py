from django.db import models
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AssistanceDemand, AssistanceProgress, AssistanceProcessRecord
from .serializers import (
    AssistanceDemandSerializer, AssistanceDemandDetailSerializer,
    AssistanceProgressSerializer, AssistanceProcessRecordSerializer,
    AssistanceAssignSerializer, AssistanceCompleteSerializer,
    AssistanceProgressCreateSerializer
)
from common.views import BaseViewSet
from common.permissions import IsRepresentative, IsVolunteer
from common.utils import generate_excel_response


class AssistanceDemandViewSet(BaseViewSet):
    queryset = AssistanceDemand.objects.select_related(
        'resident', 'assigned_to', 'resident__user'
    ).prefetch_related('process_records', 'progress_records').all()
    serializer_class = AssistanceDemandSerializer
    search_fields = ['title', 'description', 'contact_phone', 'resident__user__first_name']
    filterset_fields = [
        'type', 'priority', 'status', 'resident', 'assigned_to',
        'community', 'household_type'
    ]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AssistanceDemandDetailSerializer
        return AssistanceDemandSerializer

    @action(detail=True, methods=['get', 'post'], permission_classes=[IsRepresentative])
    def process_records(self, request, pk=None):
        assistance = self.get_object()
        if request.method == 'GET':
            records = AssistanceProcessRecord.objects.filter(
                assistance=assistance
            ).select_related('processed_by').order_by('-processed_at')
            page = self.paginate_queryset(records)
            if page is not None:
                serializer = AssistanceProcessRecordSerializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            serializer = AssistanceProcessRecordSerializer(records, many=True)
            return Response(serializer.data)
        
        from .serializers import AssistanceProcessCreateSerializer
        serializer = AssistanceProcessCreateSerializer(data=request.data)
        if serializer.is_valid():
            record = AssistanceProcessRecord.objects.create(
                assistance=assistance,
                content=serializer.validated_data['content'],
                remark=serializer.validated_data.get('remark', ''),
                processed_by=request.user
            )
            return Response(
                AssistanceProcessRecordSerializer(record).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsRepresentative])
    def assign(self, request, pk=None):
        assistance = self.get_object()
        serializer = AssistanceAssignSerializer(data=request.data)
        if serializer.is_valid():
            from users.models import User
            try:
                volunteer = User.objects.get(
                    id=serializer.validated_data['volunteer_id'],
                    role__in=['volunteer', 'representative']
                )
            except User.DoesNotExist:
                return Response(
                    {'error': '指定的志愿者不存在'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            assistance.assign(volunteer, request.user)

            from notifications.services import create_notification
            create_notification(
                user=volunteer,
                title='新的帮扶任务',
                content=f'您有新的帮扶任务：{assistance.title}',
                type='assistance',
                related_id=assistance.id
            )

            return Response({'message': '指派成功'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsVolunteer])
    def start(self, request, pk=None):
        assistance = self.get_object()
        if assistance.status not in ['pending', 'assigned']:
            return Response(
                {'error': '该需求状态不允许开始'},
                status=status.HTTP_400_BAD_REQUEST
            )
        assistance.start(request.user)
        return Response(AssistanceDemandSerializer(assistance).data)

    @action(detail=True, methods=['post'], permission_classes=[IsVolunteer])
    def complete(self, request, pk=None):
        assistance = self.get_object()
        if assistance.status != 'in_progress':
            return Response(
                {'error': '该需求未在处理中'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = AssistanceCompleteSerializer(data=request.data)
        if serializer.is_valid():
            assistance.complete(
                request.user,
                serializer.validated_data['result'],
                serializer.validated_data.get('satisfaction')
            )
            return Response(AssistanceDemandSerializer(assistance).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsRepresentative])
    def update_status(self, request, pk=None):
        assistance = self.get_object()
        new_status = request.data.get('status')
        remark = request.data.get('remark', '')
        if not new_status:
            return Response(
                {'error': '请指定状态'},
                status=status.HTTP_400_BAD_REQUEST
            )
        old_status = assistance.status
        assistance.status = new_status
        assistance.save()

        AssistanceProcessRecord.objects.create(
            assistance=assistance,
            content=f'状态从 {assistance.get_status_display()} 变更为 {assistance.get_status_display()}',
            remark=remark,
            processed_by=request.user,
            status_change=new_status
        )

        AssistanceProgress.objects.create(
            assistance=assistance,
            resident=assistance.resident,
            content=f'状态变更：{remark}',
            status=new_status,
            processed_by=request.user
        )

        return Response(AssistanceDemandSerializer(assistance).data)

    @action(detail=True, methods=['post'])
    def add_progress(self, request, pk=None):
        assistance = self.get_object()
        serializer = AssistanceProgressCreateSerializer(data=request.data)
        if serializer.is_valid():
            progress = AssistanceProgress.objects.create(
                assistance=assistance,
                resident=assistance.resident,
                content=serializer.validated_data['content'],
                status=serializer.validated_data.get('status', 'in_progress'),
                remark=serializer.validated_data.get('remark', ''),
                processed_by=request.user
            )
            return Response(
                AssistanceProgressSerializer(progress).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def my_assigned(self, request):
        queryset = self.get_queryset().filter(assigned_to=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_submitted(self, request):
        from residents.models import Resident
        try:
            resident = Resident.objects.get(user=request.user)
            queryset = self.get_queryset().filter(resident=resident)
        except Resident.DoesNotExist:
            queryset = self.get_queryset().none()

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
            'resident__user__first_name', 'assigned_to__first_name',
            'contact_phone', 'created_at', 'start_time', 'end_time',
            'actual_start_time', 'actual_end_time', 'community'
        ]
        return generate_excel_response(queryset, fields, '帮扶需求')

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        queryset = self.get_queryset()
        total = queryset.count()
        by_type = queryset.values('type').annotate(count=models.Count('id'))
        by_status = queryset.values('status').annotate(count=models.Count('id'))
        by_priority = queryset.values('priority').annotate(count=models.Count('id'))
        by_community = queryset.values('community').annotate(count=models.Count('id'))
        avg_satisfaction = AssistanceProgress.objects.filter(
            assistance__in=queryset,
            satisfaction__isnull=False
        ).aggregate(avg=models.Avg('satisfaction'))['avg']
        return Response({
            'total': total,
            'avg_satisfaction': avg_satisfaction,
            'by_type': list(by_type),
            'by_status': list(by_status),
            'by_priority': list(by_priority),
            'by_community': list(by_community)
        })


class AssistanceProgressViewSet(BaseViewSet):
    queryset = AssistanceProgress.objects.select_related('assistance', 'resident', 'processed_by').all()
    serializer_class = AssistanceProgressSerializer
    search_fields = ['content', 'resident__user__first_name', 'assistance__title']
    filterset_fields = ['assistance', 'resident', 'status', 'processed_by']
    http_method_names = ['get', 'list']

    @action(detail=False, methods=['get'])
    def by_resident(self, request):
        resident_id = request.query_params.get('resident_id')
        if resident_id:
            queryset = self.get_queryset().filter(resident_id=resident_id)
        else:
            queryset = self.get_queryset()
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
            'assistance__title', 'resident__user__first_name',
            'content', 'status', 'processed_by__first_name',
            'processed_at', 'satisfaction', 'remark'
        ]
        return generate_excel_response(queryset, fields, '帮扶进度')
