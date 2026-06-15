from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db import transaction
from django.conf import settings

from .models import ConversionFunnel, ConversionReport, ConversionReminder, StorePerformance
from .serializers import (
    ConversionFunnelSerializer,
    ConversionReportSerializer,
    ConversionReminderSerializer,
    StorePerformanceSerializer
)


class DemoFilterMixin:
    def get_queryset(self):
        queryset = super().get_queryset()
        if not getattr(settings, 'SHOW_DEMO_DATA', False):
            queryset = queryset.filter(is_demo=False)
        return queryset


class ConversionFunnelViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = ConversionFunnel.objects.all()
    serializer_class = ConversionFunnelSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'current_stage', 'membership_converted', 'booking',
        'service_record', 'payment_order', 'converted_by',
        'follow_up_status', 'is_demo'
    ]
    search_fields = [
        'booking__order_no', 'booking__contact_name', 'booking__contact_phone'
    ]
    ordering_fields = ['created_at', 'updated_at', 'current_stage']
    ordering = ['-created_at']

    @action(detail=True, methods=['post'])
    def advance_stage(self, request, pk=None):
        funnel = self.get_object()
        new_stage = request.data.get('new_stage')
        
        if not new_stage:
            return Response(
                {'detail': 'new_stage 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        valid_stages = ['booking', 'arrival', 'service', 'payment', 'membership']
        if new_stage not in valid_stages:
            return Response(
                {'detail': f'无效的阶段，必须是以下之一: {valid_stages}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            serializer = self.get_serializer()
            conversion_amount = request.data.get('conversion_amount', 0)
            converted_by = request.user if new_stage == 'membership' else None
            
            funnel = serializer.advance_stage(
                funnel, 
                new_stage, 
                converted_by=converted_by,
                conversion_amount=conversion_amount
            )
            return Response(self.get_serializer(funnel).data)
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def mark_arrival(self, request, pk=None):
        funnel = self.get_object()
        try:
            serializer = self.get_serializer()
            funnel = serializer.advance_stage(funnel, 'arrival')
            return Response(self.get_serializer(funnel).data)
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def start_service(self, request, pk=None):
        funnel = self.get_object()
        try:
            serializer = self.get_serializer()
            funnel = serializer.advance_stage(funnel, 'service')
            return Response(self.get_serializer(funnel).data)
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def mark_payment(self, request, pk=None):
        funnel = self.get_object()
        try:
            serializer = self.get_serializer()
            funnel = serializer.advance_stage(funnel, 'payment')
            return Response(self.get_serializer(funnel).data)
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def convert_membership(self, request, pk=None):
        funnel = self.get_object()
        conversion_amount = request.data.get('conversion_amount', 0)
        
        if conversion_amount <= 0:
            return Response(
                {'detail': 'conversion_amount 必须大于0'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            serializer = self.get_serializer()
            funnel = serializer.convert_to_membership(
                funnel, 
                converted_by=request.user,
                conversion_amount=conversion_amount
            )
            return Response(self.get_serializer(funnel).data)
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def by_stage(self, request):
        stage = request.query_params.get('stage')
        if not stage:
            return Response(
                {'detail': 'stage 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.filter_queryset(self.get_queryset()).filter(current_stage=stage)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        total = queryset.count()
        
        stats = {
            'total': total,
            'stages': {}
        }
        
        for stage in ['booking', 'arrival', 'service', 'payment', 'membership']:
            count = queryset.filter(current_stage=stage).count()
            stats['stages'][stage] = {
                'count': count,
                'percentage': round((count / total * 100), 2) if total > 0 else 0
            }
        
        stats['membership_converted'] = queryset.filter(membership_converted=True).count()
        stats['total_conversion_amount'] = sum(
            queryset.values_list('conversion_amount', flat=True)
        ) or 0
        
        return Response(stats)


class ConversionReportViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = ConversionReport.objects.all()
    serializer_class = ConversionReportSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['report_type', 'report_date', 'start_date', 'end_date', 'generated_by', 'is_demo']
    search_fields = ['report_type', 'report_date']
    ordering_fields = ['report_date', 'created_at']
    ordering = ['-report_date']
    http_method_names = ['get', 'post', 'head', 'options']

    @action(detail=False, methods=['post'])
    def generate_daily(self, request):
        report_date = request.data.get('report_date')
        if not report_date:
            report_date = timezone.now().date()
        else:
            from datetime import datetime
            report_date = datetime.strptime(report_date, '%Y-%m-%d').date()
        
        try:
            serializer = self.get_serializer()
            report = serializer.generate_report(
                report_type='daily',
                report_date=report_date,
                generated_by=request.user
            )
            return Response(ConversionReportSerializer(report).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def generate_weekly(self, request):
        report_date = request.data.get('report_date')
        if not report_date:
            report_date = timezone.now().date()
        else:
            from datetime import datetime
            report_date = datetime.strptime(report_date, '%Y-%m-%d').date()
        
        try:
            serializer = self.get_serializer()
            report = serializer.generate_report(
                report_type='weekly',
                report_date=report_date,
                generated_by=request.user
            )
            return Response(ConversionReportSerializer(report).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def generate_monthly(self, request):
        report_date = request.data.get('report_date')
        if not report_date:
            report_date = timezone.now().date()
        else:
            from datetime import datetime
            report_date = datetime.strptime(report_date, '%Y-%m-%d').date()
        
        try:
            serializer = self.get_serializer()
            report = serializer.generate_report(
                report_type='monthly',
                report_date=report_date,
                generated_by=request.user
            )
            return Response(ConversionReportSerializer(report).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def generate_all(self, request):
        report_date = request.data.get('report_date')
        if not report_date:
            report_date = timezone.now().date()
        else:
            from datetime import datetime
            report_date = datetime.strptime(report_date, '%Y-%m-%d').date()
        
        reports = []
        serializer = self.get_serializer()
        
        for report_type in ['daily', 'weekly', 'monthly']:
            try:
                report = serializer.generate_report(
                    report_type=report_type,
                    report_date=report_date,
                    generated_by=request.user
                )
                reports.append(ConversionReportSerializer(report).data)
            except Exception as e:
                return Response(
                    {'detail': f'生成{report_type}报表失败: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response({
            'detail': '所有报表生成成功',
            'reports': reports
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def latest(self, request):
        report_type = request.query_params.get('type', 'daily')
        queryset = self.filter_queryset(self.get_queryset()).filter(report_type=report_type)
        report = queryset.first()
        
        if not report:
            return Response(
                {'detail': '暂无报表数据'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(self.get_serializer(report).data)


class ConversionReminderViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = ConversionReminder.objects.all()
    serializer_class = ConversionReminderSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'funnel', 'reminder_type', 'assigned_to',
        'scheduled_time', 'is_completed', 'is_demo'
    ]
    search_fields = [
        'funnel__booking__order_no', 'funnel__booking__contact_name',
        'funnel__booking__contact_phone', 'notes', 'result'
    ]
    ordering_fields = ['scheduled_time', 'created_at', 'completed_at']
    ordering = ['-scheduled_time']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == 'staff':
            queryset = queryset.filter(assigned_to=user)
        return queryset

    @action(detail=False, methods=['post'])
    def batch_assign(self, request):
        reminder_ids = request.data.get('reminder_ids', [])
        assigned_to_id = request.data.get('assigned_to_id')
        
        if not reminder_ids:
            return Response(
                {'detail': 'reminder_ids 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not assigned_to_id:
            return Response(
                {'detail': 'assigned_to_id 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from apps.accounts.models import User
            assigned_to = User.objects.get(id=assigned_to_id, role__in=['staff', 'manager', 'admin'])
        except User.DoesNotExist:
            return Response(
                {'detail': '用户不存在或角色不正确'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer()
        updated_count = serializer.batch_assign(reminder_ids, assigned_to)
        
        return Response({
            'detail': f'批量分配完成，共{updated_count}条提醒已分配给{assigned_to.username}',
            'updated_count': updated_count
        })

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        reminder = self.get_object()
        result = request.data.get('result')
        notes = request.data.get('notes')
        
        if not result:
            return Response(
                {'detail': 'result 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            serializer = self.get_serializer()
            reminder = serializer.complete(reminder, result, notes)
            return Response(self.get_serializer(reminder).data)
        except Exception as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def mark_reminded(self, request, pk=None):
        reminder = self.get_object()
        if reminder.reminded_at:
            return Response(
                {'detail': '该提醒已标记为已提醒'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reminder.reminded_at = timezone.now()
        reminder.save()
        return Response(self.get_serializer(reminder).data)

    @action(detail=False, methods=['get'])
    def my_reminders(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(assigned_to=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(is_completed=False)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        queryset = self.filter_queryset(self.get_queryset()).filter(
            scheduled_time__date=today,
            is_completed=False
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class StorePerformanceViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = StorePerformance.objects.all()
    serializer_class = StorePerformanceSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['date', 'is_demo']
    search_fields = ['date']
    ordering_fields = ['date', 'total_revenue', 'conversion_rate']
    ordering = ['-date']

    def perform_create(self, serializer):
        instance = serializer.save()
        serializer.instance = serializer.calculate_stats(instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        serializer.instance = serializer.calculate_stats(instance)

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        queryset = self.filter_queryset(self.get_queryset()).filter(date=today)
        performance = queryset.first()
        
        if not performance:
            return Response(
                {'detail': '今日暂无业绩数据'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response(self.get_serializer(performance).data)

    @action(detail=False, methods=['get'])
    def this_week(self, request):
        today = timezone.now().date()
        start_date = today - timezone.timedelta(days=today.weekday())
        end_date = start_date + timezone.timedelta(days=6)
        
        queryset = self.filter_queryset(self.get_queryset()).filter(
            date__gte=start_date,
            date__lte=end_date
        )
        
        return self._get_aggregate_stats(queryset, '本周')

    @action(detail=False, methods=['get'])
    def this_month(self, request):
        today = timezone.now().date()
        start_date = today.replace(day=1)
        if start_date.month == 12:
            end_date = start_date.replace(year=start_date.year + 1, month=1, day=1) - timezone.timedelta(days=1)
        else:
            end_date = start_date.replace(month=start_date.month + 1, day=1) - timezone.timedelta(days=1)
        
        queryset = self.filter_queryset(self.get_queryset()).filter(
            date__gte=start_date,
            date__lte=end_date
        )
        
        return self._get_aggregate_stats(queryset, '本月')

    def _get_aggregate_stats(self, queryset, period_name):
        from django.db.models import Sum, Avg
        
        if not queryset.exists():
            return Response(
                {'detail': f'{period_name}暂无业绩数据'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        aggregates = queryset.aggregate(
            total_visitors=Sum('total_visitors'),
            total_orders=Sum('total_orders'),
            total_revenue=Sum('total_revenue'),
            new_customers=Sum('new_customers'),
            returning_customers=Sum('returning_customers'),
            membership_sales=Sum('membership_sales'),
            membership_revenue=Sum('membership_revenue'),
            avg_conversion_rate=Avg('conversion_rate'),
            avg_average_spend=Avg('average_spend')
        )
        
        daily_data = self.get_serializer(queryset, many=True).data
        
        return Response({
            'period': period_name,
            'daily_data': daily_data,
            'summary': {
                'total_visitors': aggregates['total_visitors'] or 0,
                'total_orders': aggregates['total_orders'] or 0,
                'total_revenue': aggregates['total_revenue'] or 0,
                'new_customers': aggregates['new_customers'] or 0,
                'returning_customers': aggregates['returning_customers'] or 0,
                'membership_sales': aggregates['membership_sales'] or 0,
                'membership_revenue': aggregates['membership_revenue'] or 0,
                'avg_conversion_rate': round(aggregates['avg_conversion_rate'] or 0, 2),
                'avg_average_spend': round(aggregates['avg_average_spend'] or 0, 2)
            }
        })

    @action(detail=False, methods=['get'])
    def date_range(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {'detail': 'start_date 和 end_date 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from datetime import datetime
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'detail': '日期格式必须是 YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.filter_queryset(self.get_queryset()).filter(
            date__gte=start_date,
            date__lte=end_date
        )
        
        return self._get_aggregate_stats(queryset, f'{start_date} 至 {end_date}')
