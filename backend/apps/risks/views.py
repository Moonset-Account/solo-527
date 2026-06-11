from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from django.http import HttpResponse
import csv
from .models import RiskSample, RiskRule
from .serializers import (
    RiskSampleListSerializer, RiskSampleDetailSerializer,
    RiskSampleCreateSerializer, RiskSampleActionSerializer,
    RiskSampleBatchProcessSerializer, RiskRuleSerializer
)


class RiskSampleViewSet(viewsets.ModelViewSet):
    queryset = RiskSample.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['risk_level', 'risk_category', 'status', 'source']
    search_fields = ['title', 'content', 'tags']
    ordering_fields = ['created_at', 'updated_at', 'risk_level']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return RiskSampleListSerializer
        elif self.action == 'retrieve':
            return RiskSampleDetailSerializer
        elif self.action == 'create':
            return RiskSampleCreateSerializer
        return RiskSampleDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d')
                queryset = queryset.filter(created_at__date__gte=start.date())
            except ValueError:
                pass
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d')
                queryset = queryset.filter(created_at__date__lte=end.date())
            except ValueError:
                pass

        return queryset

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'], url_path='confirm')
    def confirm(self, request, pk=None):
        risk_sample = self.get_object()
        serializer = RiskSampleActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        risk_sample.status = 'confirmed'
        if serializer.validated_data.get('handle_comment'):
            risk_sample.handle_comment = serializer.validated_data['handle_comment']
        risk_sample.save()

        return Response(RiskSampleDetailSerializer(risk_sample).data)

    @action(detail=True, methods=['post'], url_path='resolve')
    def resolve(self, request, pk=None):
        risk_sample = self.get_object()
        serializer = RiskSampleActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        risk_sample.status = 'resolved'
        risk_sample.handled_by = request.user
        risk_sample.handled_at = timezone.now()
        if serializer.validated_data.get('handle_comment'):
            risk_sample.handle_comment = serializer.validated_data['handle_comment']
        risk_sample.save()

        return Response(RiskSampleDetailSerializer(risk_sample).data)

    @action(detail=True, methods=['post'], url_path='mark-false-positive')
    def mark_false_positive(self, request, pk=None):
        risk_sample = self.get_object()
        serializer = RiskSampleActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        risk_sample.status = 'false_positive'
        risk_sample.handled_by = request.user
        risk_sample.handled_at = timezone.now()
        if serializer.validated_data.get('handle_comment'):
            risk_sample.handle_comment = serializer.validated_data['handle_comment']
        risk_sample.save()

        return Response(RiskSampleDetailSerializer(risk_sample).data)

    @action(detail=False, methods=['post'], url_path='batch-process')
    def batch_process(self, request):
        serializer = RiskSampleBatchProcessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ids = serializer.validated_data['ids']
        action = serializer.validated_data['action']
        handle_comment = serializer.validated_data.get('handle_comment', '')

        update_data = {}
        if action == 'confirm':
            update_data['status'] = 'confirmed'
        elif action == 'resolve':
            update_data['status'] = 'resolved'
            update_data['handled_by'] = request.user
            update_data['handled_at'] = timezone.now()
        elif action == 'mark_false_positive':
            update_data['status'] = 'false_positive'
            update_data['handled_by'] = request.user
            update_data['handled_at'] = timezone.now()

        if handle_comment:
            update_data['handle_comment'] = handle_comment

        updated_count = RiskSample.objects.filter(id__in=ids).update(**update_data)

        action_names = {
            'confirm': '确认风险',
            'resolve': '处理完成',
            'mark_false_positive': '标记为误报'
        }

        return Response({
            'success': True,
            'updated_count': updated_count,
            'message': f'已{action_names.get(action, "处理")} {updated_count} 条风险样本'
        })

    @action(detail=False, methods=['get'], url_path='export')
    def export(self, request):
        queryset = self.filter_queryset(self.get_queryset())

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="risk_samples.csv"'
        response.write('\ufeff')

        writer = csv.writer(response)
        writer.writerow([
            'ID', '标题', '内容', '风险等级', '风险分类', '来源',
            '状态', '标签', '创建时间', '更新时间'
        ])

        for sample in queryset:
            writer.writerow([
                sample.id,
                sample.title,
                sample.content[:200],
                sample.get_risk_level_display(),
                sample.get_risk_category_display(),
                sample.get_source_display(),
                sample.get_status_display(),
                ', '.join(sample.tags) if sample.tags else '',
                sample.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                sample.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
            ])

        return response

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        queryset = RiskSample.objects.all()

        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d')
                queryset = queryset.filter(created_at__date__gte=start.date())
            except ValueError:
                pass
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d')
                queryset = queryset.filter(created_at__date__lte=end.date())
            except ValueError:
                pass

        total = queryset.count()
        pending = queryset.filter(status='pending').count()
        confirmed = queryset.filter(status='confirmed').count()
        resolved = queryset.filter(status='resolved').count()
        false_positive = queryset.filter(status='false_positive').count()

        level_stats = queryset.values('risk_level').annotate(count=Count('id'))
        category_stats = queryset.values('risk_category').annotate(count=Count('id'))

        resolution_rate = (resolved / total * 100) if total > 0 else 0

        return Response({
            'total': total,
            'pending': pending,
            'confirmed': confirmed,
            'resolved': resolved,
            'false_positive': false_positive,
            'resolution_rate': round(resolution_rate, 2),
            'by_level': list(level_stats),
            'by_category': list(category_stats),
        })


class RiskRuleViewSet(viewsets.ModelViewSet):
    queryset = RiskRule.objects.all()
    serializer_class = RiskRuleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['rule_type', 'risk_level', 'is_active']
    search_fields = ['name', 'pattern']
    ordering_fields = ['created_at', 'updated_at', 'risk_level']
    ordering = ['-created_at']

    @action(detail=True, methods=['post'], url_path='toggle')
    def toggle(self, request, pk=None):
        rule = self.get_object()
        rule.is_active = not rule.is_active
        rule.save()
        return Response(RiskRuleSerializer(rule).data)
