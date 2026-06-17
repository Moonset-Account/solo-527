from rest_framework import viewsets, status, permissions, mixins
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.http import HttpResponse, FileResponse
import os
from .models import QualityCheck, ImprovementAction, ExportRecord
from .serializers import (
    QualityCheckSerializer, ImprovementActionSerializer,
    ExportRecordSerializer, ExportCheckDuplicateSerializer
)
from .services import (
    QualityCheckService, ImprovementActionService,
    ExportRecordService, ServiceTicketService
)
from apps.tickets.serializers import TicketSerializer
from apps.core.views import BaseViewSet


class QualityCheckViewSet(BaseViewSet):
    queryset = QualityCheck.objects.select_related(
        'ticket', 'checker'
    ).all()
    serializer_class = QualityCheckSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'checker', 'ticket']
    search_fields = ['ticket__title', 'ticket__ticket_no',
                     'comments', 'issues_found', 'suggestions']
    ordering_fields = ['created_at', 'score', 'checked_at']

    def perform_create(self, serializer):
        data = serializer.validated_data
        check = QualityCheckService.create_quality_check(
            ticket_id=data['ticket'].id,
            checker_id=data['checker'].id,
            check_items=data.get('check_items', {}),
            created_by=self.request.user
        )
        serializer.instance = check

    @action(detail=True, methods=['post'], url_path='start')
    def start(self, request, pk=None):
        check = self.get_object()
        check = QualityCheckService.start_check(check, request.user)
        return Response({
            'status': 'success',
            'message': '质检已开始',
            'data': QualityCheckSerializer(check, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], url_path='pass')
    def pass_check(self, request, pk=None):
        check = self.get_object()
        score = request.data.get('score', 100)
        comments = request.data.get('comments', '')
        check = QualityCheckService.pass_check(check, score, comments, request.user)
        return Response({
            'status': 'success',
            'message': '质检通过',
            'data': QualityCheckSerializer(check, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], url_path='fail')
    def fail_check(self, request, pk=None):
        check = self.get_object()
        score = request.data.get('score', 0)
        comments = request.data.get('comments', '')
        issues_found = request.data.get('issues_found', '')
        suggestions = request.data.get('suggestions', '')
        create_improvement = request.data.get('create_improvement', False)
        check = QualityCheckService.fail_check(
            check, score, comments, issues_found,
            suggestions, create_improvement, request.user
        )
        return Response({
            'status': 'success',
            'message': '质检未通过',
            'data': QualityCheckSerializer(check, context={'request': request}).data
        })


class ImprovementActionViewSet(BaseViewSet):
    queryset = ImprovementAction.objects.select_related(
        'assignee', 'quality_check', 'related_ticket'
    ).all()
    serializer_class = ImprovementActionSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'assignee',
                        'quality_check', 'related_ticket', 'is_overdue']
    search_fields = ['title', 'description', 'solution', 'result']
    ordering_fields = ['created_at', 'priority', 'due_date', 'progress']

    def perform_create(self, serializer):
        data = serializer.validated_data
        action = ImprovementActionService.create_improvement_action(
            title=data['title'],
            description=data['description'],
            assignee_id=data['assignee'].id,
            priority=data.get('priority', 'medium'),
            due_date=data.get('due_date'),
            quality_check_id=data.get('quality_check', {}).id if data.get('quality_check') else None,
            related_ticket_id=data.get('related_ticket', {}).id if data.get('related_ticket') else None,
            created_by=self.request.user
        )
        serializer.instance = action

    @action(detail=True, methods=['post'], url_path='start')
    def start(self, request, pk=None):
        action = self.get_object()
        action = ImprovementActionService.start_action(action, request.user)
        return Response({
            'status': 'success',
            'message': '改进措施已开始执行',
            'data': ImprovementActionSerializer(action, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        action = self.get_object()
        result = request.data.get('result', '')
        progress = request.data.get('progress', 100)
        action = ImprovementActionService.complete_action(
            action, result, progress, request.user
        )
        return Response({
            'status': 'success',
            'message': '改进措施已完成',
            'data': ImprovementActionSerializer(action, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        action = self.get_object()
        action = ImprovementActionService.cancel_action(action, request.user)
        return Response({
            'status': 'success',
            'message': '改进措施已取消',
            'data': ImprovementActionSerializer(action, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], url_path='update-progress')
    def update_progress(self, request, pk=None):
        action = self.get_object()
        progress = int(request.data.get('progress', 0))
        action = ImprovementActionService.update_progress(
            action, progress, request.user
        )
        return Response({
            'status': 'success',
            'message': '进度已更新',
            'data': ImprovementActionSerializer(action, context={'request': request}).data
        })


class ExportRecordViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet
):
    queryset = ExportRecord.objects.select_related(
        'created_by', 'previous_export'
    ).all()
    serializer_class = ExportRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['export_type', 'status', 'created_by', 'filter_hash']
    search_fields = ['file_name', 'error_message']
    ordering_fields = ['created_at', 'completed_at']

    def get_queryset(self):
        return ExportRecordService.get_user_exports(self.request.user.id)

    def perform_create(self, serializer):
        data = serializer.validated_data
        export = ExportRecordService.create_export(
            export_type=data['export_type'],
            filters=data.get('filters', {}),
            file_name=data['file_name'],
            created_by=self.request.user
        )
        serializer.instance = export

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        export = self.get_object()
        if export.status != 'completed' or not export.file_path:
            return Response(
                {'error': '文件不可下载'},
                status=status.HTTP_400_BAD_REQUEST
            )

        file_path = export.file_path.path
        if not os.path.exists(file_path):
            return Response(
                {'error': '文件不存在'},
                status=status.HTTP_404_NOT_FOUND
            )

        response = FileResponse(open(file_path, 'rb'))
        response['Content-Disposition'] = f'attachment; filename="{export.file_name}"'
        return response

    @action(detail=True, methods=['post'], url_path='start')
    def start(self, request, pk=None):
        export = self.get_object()
        export = ExportRecordService.start_export(export)
        return Response({
            'status': 'success',
            'message': '导出任务已开始',
            'data': ExportRecordSerializer(export, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        export = self.get_object()
        file_path = request.data.get('file_path')
        file_size = request.data.get('file_size')
        record_count = request.data.get('record_count')
        export = ExportRecordService.complete_export(
            export, file_path, file_size, record_count
        )
        return Response({
            'status': 'success',
            'message': '导出任务已完成',
            'data': ExportRecordSerializer(export, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], url_path='fail')
    def fail(self, request, pk=None):
        export = self.get_object()
        error_message = request.data.get('error_message', '')
        export = ExportRecordService.fail_export(export, error_message)
        return Response({
            'status': 'success',
            'message': '导出任务失败',
            'data': ExportRecordSerializer(export, context={'request': request}).data
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def service_tickets(request):
    filters = {
        'status': request.query_params.get('status'),
        'type': request.query_params.get('type'),
        'priority': request.query_params.get('priority'),
        'assignee_id': request.query_params.get('assignee_id'),
        'creator_id': request.query_params.get('creator_id'),
        'date_from': request.query_params.get('date_from'),
        'date_to': request.query_params.get('date_to'),
        'keyword': request.query_params.get('keyword'),
        'is_overdue': request.query_params.get('is_overdue'),
    }
    filters = {k: v for k, v in filters.items() if v is not None}

    queryset = ServiceTicketService.filter_service_tickets(filters)

    page = request.query_params.get('page', 1)
    page_size = 20
    start = (int(page) - 1) * page_size
    end = start + page_size

    total = queryset.count()
    items = queryset[start:end]

    return Response({
        'count': total,
        'page': int(page),
        'page_size': page_size,
        'results': TicketSerializer(items, many=True, context={'request': request}).data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_duplicate_export(request):
    serializer = ExportCheckDuplicateSerializer(data=request.query_params)
    if serializer.is_valid():
        result = ExportRecordService.check_duplicate(
            serializer.validated_data['export_type'],
            serializer.validated_data['filters']
        )
        return Response(result)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
