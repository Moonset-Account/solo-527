from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from .models import ReportTemplate, ReportSchedule, ReportInstance, DashboardWidget
from .serializers import (
    ReportTemplateSerializer, ReportScheduleSerializer,
    ReportInstanceSerializer, DashboardWidgetSerializer,
    DurationStatsSerializer, ResultStatsSerializer, TrendReportSerializer
)
from .services import DurationReportService, ResultReportService, TrendReportService
from apps.core.views import BaseViewSet


class ReportTemplateViewSet(BaseViewSet):
    queryset = ReportTemplate.objects.all()
    serializer_class = ReportTemplateSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['report_type', 'status']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']


class ReportScheduleViewSet(BaseViewSet):
    queryset = ReportSchedule.objects.select_related('template').all()
    serializer_class = ReportScheduleSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['frequency', 'status', 'template']
    search_fields = ['name', 'template__name']
    ordering_fields = ['created_at', 'next_run_at']

    @action(detail=True, methods=['post'])
    def run_now(self, request, pk=None):
        from datetime import datetime
        schedule = self.get_object()
        report_instance = ReportInstance.objects.create(
            template=schedule.template,
            schedule=schedule,
            name=f'{schedule.name}-{datetime.now().strftime("%Y%m%d%H%M%S")}',
            report_type=schedule.template.report_type,
            status=ReportInstance.Status.PENDING,
            filters=schedule.filters,
            created_by=request.user,
            updated_by=request.user,
        )
        return Response({
            'status': 'success',
            'message': '报表生成任务已创建',
            'report_instance_id': report_instance.id
        })


class ReportInstanceViewSet(BaseViewSet):
    queryset = ReportInstance.objects.select_related(
        'template', 'schedule'
    ).all()
    serializer_class = ReportInstanceSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['report_type', 'status', 'template', 'schedule']
    search_fields = ['name', 'error_message']
    ordering_fields = ['created_at', 'completed_at', 'period_start']

    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        report = self.get_object()
        report.status = ReportInstance.Status.GENERATING
        report.started_at = timezone.now()
        report.save()
        return Response({'status': 'success', 'message': '报表生成中'})


class DashboardWidgetViewSet(BaseViewSet):
    queryset = DashboardWidget.objects.all()
    serializer_class = DashboardWidgetSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['widget_type', 'size', 'is_active']
    search_fields = ['name', 'data_source']
    ordering_fields = ['position', 'name']

    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def duration_stats(request):
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    group_by = request.query_params.get('group_by', 'type')

    stats = DurationReportService.get_duration_stats(
        start_date=start_date,
        end_date=end_date,
        group_by=group_by
    )
    serializer = DurationStatsSerializer(data=stats)
    if serializer.is_valid():
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def result_stats(request):
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    stats = ResultReportService.get_result_stats(
        start_date=start_date,
        end_date=end_date
    )
    serializer = ResultStatsSerializer(data=stats)
    if serializer.is_valid():
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def trend_stats(request):
    days = int(request.query_params.get('days', 30))
    period = request.query_params.get('period', 'day')

    stats = TrendReportService.get_trend_stats(
        days=days,
        period=period
    )
    serializer = TrendReportSerializer(data=stats)
    if serializer.is_valid():
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
