from rest_framework import viewsets, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from .models import AccuracyStats, DailyStats, UsageStats, TokenUsage
from apps.reviews.models import Review
from apps.risks.models import RiskSample
from apps.conversations.models import Conversation, Message
from .serializers import (
    AccuracyStatsSerializer, DailyStatsSerializer, StatsOverviewSerializer,
    ErrorStatsSerializer, SalesOperationRankingSerializer, PromptVersionRankingSerializer,
    UsageStatsSerializer, TokenUsageSerializer
)


class OverviewAPIView(APIView):

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days - 1)

        date_filter = Q(created_at__date__gte=start_date) & Q(created_at__date__lte=end_date)

        total_conversations = Conversation.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).count()

        total_messages = Message.objects.filter(date_filter).count()

        ai_messages = Message.objects.filter(
            date_filter,
            is_ai_suggestion=True
        )
        total_ai_calls = ai_messages.count()

        ai_adopted = ai_messages.filter(is_adopted=True).count()
        ai_adoption_rate = (ai_adopted / total_ai_calls * 100) if total_ai_calls > 0 else 0

        total_reviews = Review.objects.filter(date_filter).count()
        approved_reviews = Review.objects.filter(date_filter, status='approved').count()
        approval_rate = (approved_reviews / total_reviews * 100) if total_reviews > 0 else 0

        total_risks = RiskSample.objects.filter(date_filter).count()
        resolved_risks = RiskSample.objects.filter(date_filter, status='resolved').count()
        risk_resolution_rate = (resolved_risks / total_risks * 100) if total_risks > 0 else 0

        accurate_reviews = Review.objects.filter(
            date_filter,
            is_accurate=True
        ).count()
        reviewed_with_accuracy = Review.objects.filter(
            date_filter,
            is_accurate__isnull=False
        ).count()
        accuracy_rate = (accurate_reviews / reviewed_with_accuracy * 100) if reviewed_with_accuracy > 0 else 0

        daily_stats = DailyStats.objects.filter(date__gte=start_date, date__lte=end_date)
        total_tokens = daily_stats.aggregate(Sum('total_tokens'))['total_tokens__sum'] or 0
        total_cost = daily_stats.aggregate(Sum('total_cost'))['total_cost__sum'] or Decimal('0')

        data = {
            'total_conversations': total_conversations,
            'total_messages': total_messages,
            'total_ai_calls': total_ai_calls,
            'total_reviews': total_reviews,
            'total_risks': total_risks,
            'accuracy_rate': round(accuracy_rate, 2),
            'ai_adoption_rate': round(ai_adoption_rate, 2),
            'approval_rate': round(approval_rate, 2),
            'risk_resolution_rate': round(risk_resolution_rate, 2),
            'total_tokens': total_tokens,
            'total_cost': float(total_cost)
        }

        return Response(data)


class AccuracyStatsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AccuracyStats.objects.all()
    serializer_class = AccuracyStatsSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['sales_operation', 'prompt_version']
    ordering_fields = ['date', 'accuracy_rate', 'total_calls']
    ordering = ['-date']

    def get_queryset(self):
        queryset = super().get_queryset()
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        group_by = self.request.query_params.get('group_by')

        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__gte=start)
            except ValueError:
                pass
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__lte=end)
            except ValueError:
                pass

        if group_by:
            queryset = self._group_queryset(queryset, group_by)

        return queryset

    def _group_queryset(self, queryset, group_by):
        if group_by == 'date':
            return queryset
        elif group_by == 'sales_operation':
            return queryset.values('sales_operation').annotate(
                total_calls=Sum('total_calls'),
                accurate_calls=Sum('accurate_calls'),
                accuracy_rate=Avg('accuracy_rate'),
                error_timeout=Sum('error_timeout'),
                error_rate_limit=Sum('error_rate_limit'),
                error_api_error=Sum('error_api_error'),
                error_content_filter=Sum('error_content_filter'),
                error_other=Sum('error_other'),
                avg_response_time=Avg('avg_response_time')
            ).order_by('-total_calls')
        elif group_by == 'prompt_version':
            return queryset.values('prompt_version').annotate(
                total_calls=Sum('total_calls'),
                accurate_calls=Sum('accurate_calls'),
                accuracy_rate=Avg('accuracy_rate'),
                error_timeout=Sum('error_timeout'),
                error_rate_limit=Sum('error_rate_limit'),
                error_api_error=Sum('error_api_error'),
                error_content_filter=Sum('error_content_filter'),
                error_other=Sum('error_other'),
                avg_response_time=Avg('avg_response_time')
            ).order_by('-total_calls')
        return queryset

    def list(self, request, *args, **kwargs):
        group_by = request.query_params.get('group_by')
        if group_by and group_by in ['sales_operation', 'prompt_version']:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            if page is not None:
                return self.get_paginated_response(page)
            return Response(queryset)
        return super().list(request, *args, **kwargs)


class DailyStatsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DailyStats.objects.all()
    serializer_class = DailyStatsSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['date']
    ordering_fields = ['date', 'total_conversations', 'total_messages']
    ordering = ['-date']

    def get_queryset(self):
        queryset = super().get_queryset()
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__gte=start)
            except ValueError:
                pass
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__lte=end)
            except ValueError:
                pass

        return queryset


class ErrorStatsAPIView(APIView):

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        sales_operation = request.query_params.get('sales_operation')
        prompt_version = request.query_params.get('prompt_version')

        queryset = AccuracyStats.objects.all()

        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__gte=start)
            except ValueError:
                pass
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__lte=end)
            except ValueError:
                pass
        if sales_operation:
            queryset = queryset.filter(sales_operation=sales_operation)
        if prompt_version:
            queryset = queryset.filter(prompt_version=prompt_version)

        totals = queryset.aggregate(
            timeout=Sum('error_timeout'),
            rate_limit=Sum('error_rate_limit'),
            api_error=Sum('error_api_error'),
            content_filter=Sum('error_content_filter'),
            other=Sum('error_other'),
        )

        total_errors = sum([
            totals['timeout'] or 0,
            totals['rate_limit'] or 0,
            totals['api_error'] or 0,
            totals['content_filter'] or 0,
            totals['other'] or 0,
        ])

        error_types = [
            ('timeout', '超时错误', totals['timeout'] or 0),
            ('rate_limit', '限流错误', totals['rate_limit'] or 0),
            ('api_error', 'API错误', totals['api_error'] or 0),
            ('content_filter', '内容过滤', totals['content_filter'] or 0),
            ('other', '其他错误', totals['other'] or 0),
        ]

        result = []
        for key, name, count in error_types:
            percentage = (count / total_errors * 100) if total_errors > 0 else 0
            result.append({
                'error_type': key,
                'error_type_name': name,
                'count': count,
                'percentage': round(percentage, 2)
            })

        return Response({
            'total_errors': total_errors,
            'errors': result
        })


class SalesOperationRankingAPIView(APIView):

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        limit = int(request.query_params.get('limit', 10))

        queryset = AccuracyStats.objects.all()

        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__gte=start)
            except ValueError:
                pass
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__lte=end)
            except ValueError:
                pass

        rankings = queryset.values('sales_operation').annotate(
            total_calls=Sum('total_calls'),
            accurate_calls=Sum('accurate_calls'),
        ).order_by('-total_calls')[:limit]

        result = []
        for item in rankings:
            accuracy_rate = (item['accurate_calls'] / item['total_calls'] * 100) if item['total_calls'] > 0 else 0
            result.append({
                'sales_operation': item['sales_operation'],
                'total_calls': item['total_calls'],
                'accurate_calls': item['accurate_calls'],
                'accuracy_rate': round(accuracy_rate, 2)
            })

        return Response(result)


class PromptVersionRankingAPIView(APIView):

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        limit = int(request.query_params.get('limit', 10))

        queryset = AccuracyStats.objects.all()

        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__gte=start)
            except ValueError:
                pass
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__lte=end)
            except ValueError:
                pass

        rankings = queryset.values('prompt_version').annotate(
            total_calls=Sum('total_calls'),
            accurate_calls=Sum('accurate_calls'),
        ).order_by('-accuracy_rate')[:limit]

        result = []
        for item in rankings:
            accuracy_rate = (item['accurate_calls'] / item['total_calls'] * 100) if item['total_calls'] > 0 else 0
            result.append({
                'prompt_version': item['prompt_version'],
                'total_calls': item['total_calls'],
                'accurate_calls': item['accurate_calls'],
                'accuracy_rate': round(accuracy_rate, 2)
            })

        result.sort(key=lambda x: x['accuracy_rate'], reverse=True)

        return Response(result)


class UsageStatsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UsageStats.objects.all()
    serializer_class = UsageStatsSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['date']
    ordering_fields = ['date', 'total_conversations', 'total_tokens']
    ordering = ['-date']

    def get_queryset(self):
        queryset = super().get_queryset()
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date:
            try:
                start = datetime.strptime(start_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__gte=start)
            except ValueError:
                pass
        if end_date:
            try:
                end = datetime.strptime(end_date, '%Y-%m-%d').date()
                queryset = queryset.filter(date__lte=end)
            except ValueError:
                pass

        return queryset


class TokenUsageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TokenUsage.objects.all()
    serializer_class = TokenUsageSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['user', 'date', 'model']
    ordering_fields = ['date', 'total_tokens', 'cost']
    ordering = ['-date']
