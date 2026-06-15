from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db import transaction, models
from django.conf import settings
from datetime import timedelta

from .models import DashboardWidget, DashboardLayout, LayoutWidget, Alert
from .serializers import (
    DashboardWidgetSerializer,
    DashboardLayoutSerializer,
    LayoutWidgetSerializer,
    AlertSerializer
)


def get_widget_data(data_source):
    from apps.bookings.models import Booking
    from apps.payments.models import PaymentOrder
    from apps.membership.models import MemberMembership
    from apps.conversion.models import ConversionFunnel, ConversionReminder
    from apps.services.models import ServiceRecord, TestDriveSlot

    show_demo = getattr(settings, 'SHOW_DEMO_DATA', False)
    today = timezone.now().date()
    start_of_week = today - timedelta(days=today.weekday())
    start_of_month = today.replace(day=1)

    booking_qs = Booking.objects.all()
    if not show_demo:
        booking_qs = booking_qs.filter(is_demo=False)

    payment_qs = PaymentOrder.objects.all()
    if not show_demo:
        payment_qs = payment_qs.filter(is_demo=False, status='paid')

    membership_qs = MemberMembership.objects.all()
    if not show_demo:
        membership_qs = membership_qs.filter(is_demo=False)

    funnel_qs = ConversionFunnel.objects.all()
    if not show_demo:
        funnel_qs = funnel_qs.filter(is_demo=False)

    reminder_qs = ConversionReminder.objects.all()
    if not show_demo:
        reminder_qs = reminder_qs.filter(is_demo=False, is_completed=False)

    service_qs = ServiceRecord.objects.all()
    if not show_demo:
        service_qs = service_qs.filter(is_demo=False)

    test_drive_qs = TestDriveSlot.objects.all()
    if not show_demo:
        test_drive_qs = test_drive_qs.filter(is_demo=False)

    if data_source == 'bookings_today':
        count = booking_qs.filter(booking_date=today).count()
        return {'value': count, 'label': '今日预约', 'unit': '单'}

    elif data_source == 'bookings_this_week':
        count = booking_qs.filter(booking_date__gte=start_of_week, booking_date__lte=today).count()
        return {'value': count, 'label': '本周预约', 'unit': '单'}

    elif data_source == 'arrivals_today':
        count = booking_qs.filter(booking_date=today, arrival_time__isnull=False).count()
        return {'value': count, 'label': '今日到店', 'unit': '人'}

    elif data_source == 'revenue_today':
        amount = payment_qs.filter(paid_at__date=today).aggregate(
            total=models.Sum('paid_amount')
        )['total'] or 0
        return {'value': float(amount), 'label': '今日营收', 'unit': '元'}

    elif data_source == 'revenue_this_month':
        amount = payment_qs.filter(paid_at__date__gte=start_of_month).aggregate(
            total=models.Sum('paid_amount')
        )['total'] or 0
        return {'value': float(amount), 'label': '本月营收', 'unit': '元'}

    elif data_source == 'new_memberships':
        count = membership_qs.filter(created_at__date__gte=start_of_month).count()
        return {'value': count, 'label': '新增会员', 'unit': '人'}

    elif data_source == 'conversion_rate':
        total_bookings = booking_qs.filter(booking_date__gte=start_of_month).count()
        if total_bookings > 0:
            paid_count = funnel_qs.filter(created_at__date__gte=start_of_month, current_stage__in=['payment', 'membership']).count()
            rate = round((paid_count / total_bookings) * 100, 2)
        else:
            rate = 0
        return {'value': rate, 'label': '转化率', 'unit': '%'}

    elif data_source == 'pending_reminders':
        count = reminder_qs.filter(scheduled_time__lte=timezone.now()).count()
        return {'value': count, 'label': '待处理提醒', 'unit': '条'}

    elif data_source == 'service_status':
        statuses = service_qs.filter(created_at__date=today).values('status').annotate(
            count=models.Count('id')
        )
        status_map = {
            'pending': '待服务',
            'in_progress': '服务中',
            'completed': '已完成',
            'cancelled': '已取消',
            'refunded': '已退款'
        }
        data = []
        for s in statuses:
            data.append({
                'name': status_map.get(s['status'], s['status']),
                'value': s['count']
            })
        return {'data': data, 'label': '服务状态分布'}

    elif data_source == 'payment_methods':
        methods = payment_qs.filter(paid_at__date__gte=start_of_month).values('payment_method').annotate(
            count=models.Count('id'),
            amount=models.Sum('paid_amount')
        )
        method_map = {
            'wechat': '微信支付',
            'alipay': '支付宝',
            'cash': '现金',
            'card': '银行卡',
            'points': '积分抵扣',
            'balance': '余额支付',
            'other': '其他'
        }
        data = []
        for m in methods:
            data.append({
                'name': method_map.get(m['payment_method'], m['payment_method']),
                'value': float(m['amount'] or 0),
                'count': m['count']
            })
        return {'data': data, 'label': '支付方式分布'}

    elif data_source == 'revenue_trend':
        days = []
        amounts = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            amount = payment_qs.filter(paid_at__date=day).aggregate(
                total=models.Sum('paid_amount')
            )['total'] or 0
            days.append(day.strftime('%m-%d'))
            amounts.append(float(amount))
        return {'days': days, 'amounts': amounts, 'label': '营收趋势'}

    elif data_source == 'top_services':
        services = service_qs.filter(created_at__date__gte=start_of_month).values(
            'service_item__name'
        ).annotate(
            count=models.Count('id'),
            revenue=models.Sum('final_amount')
        ).order_by('-count')[:5]
        data = []
        for s in services:
            data.append({
                'name': s['service_item__name'],
                'count': s['count'],
                'revenue': float(s['revenue'] or 0)
            })
        return {'data': data, 'label': '热门服务'}

    elif data_source == 'staff_performance':
        staff = service_qs.filter(
            created_at__date__gte=start_of_month,
            staff__isnull=False
        ).values(
            'staff__username'
        ).annotate(
            count=models.Count('id'),
            revenue=models.Sum('final_amount')
        ).order_by('-revenue')[:10]
        data = []
        for s in staff:
            data.append({
                'name': s['staff__username'],
                'count': s['count'],
                'revenue': float(s['revenue'] or 0)
            })
        return {'data': data, 'label': '员工业绩'}

    elif data_source == 'cashier_discrepancies':
        from apps.payments.models import CashierShift
        shift_qs = CashierShift.objects.all()
        if not show_demo:
            shift_qs = shift_qs.filter(is_demo=False)
        discrepancies = shift_qs.filter(cash_discrepancy__gt=0).count()
        return {'value': discrepancies, 'label': '收银差异', 'unit': '笔'}

    elif data_source == 'test_drive_slots':
        slots = test_drive_qs.filter(date=today, status='available').count()
        return {'value': slots, 'label': '可预约试驾', 'unit': '时段'}

    return None


class DemoFilterMixin:
    def get_queryset(self):
        queryset = super().get_queryset()
        if not getattr(settings, 'SHOW_DEMO_DATA', False):
            model = queryset.model
            if hasattr(model, 'is_demo'):
                queryset = queryset.filter(is_demo=False)
        return queryset


class DashboardWidgetViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = DashboardWidget.objects.all()
    serializer_class = DashboardWidgetSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['widget_type', 'data_source', 'is_visible']
    search_fields = ['name', 'title']
    ordering_fields = ['position', 'name', 'created_at']
    ordering = ['position']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def data(self, request, pk=None):
        widget = self.get_object()
        data = get_widget_data(widget.data_source)
        return Response({
            'widget_id': widget.id,
            'data_source': widget.data_source,
            'data': data,
            'updated_at': timezone.now().isoformat()
        })

    @action(detail=False, methods=['get'])
    def visible(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(is_visible=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def batch_reorder(self, request):
        positions = request.data.get('positions', {})
        if not isinstance(positions, dict):
            return Response(
                {'detail': 'positions 参数格式错误'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            for widget_id, position in positions.items():
                try:
                    widget = DashboardWidget.objects.get(id=widget_id)
                    widget.position = position
                    widget.save()
                except DashboardWidget.DoesNotExist:
                    pass

        return Response({'detail': '排序更新成功'})


class DashboardLayoutViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = DashboardLayout.objects.all()
    serializer_class = DashboardLayoutSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['user', 'is_default']
    search_fields = ['name']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == 'member':
            queryset = queryset.filter(user=user)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_layouts(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(user=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def default(self, request):
        layout = self.filter_queryset(self.get_queryset()).filter(
            user=request.user, is_default=True
        ).first()
        if not layout:
            layout = self.filter_queryset(self.get_queryset()).filter(
                user=request.user
            ).first()
        if layout:
            serializer = self.get_serializer(layout)
            return Response(serializer.data)
        return Response({'detail': '未找到布局'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        layout = self.get_object()
        with transaction.atomic():
            DashboardLayout.objects.filter(user=request.user).update(is_default=False)
            layout.is_default = True
            layout.save()
        serializer = self.get_serializer(layout)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_widget(self, request, pk=None):
        layout = self.get_object()
        widget_id = request.data.get('widget_id')
        row = request.data.get('row', 0)
        col = request.data.get('col', 0)
        width = request.data.get('width', 1)
        height = request.data.get('height', 1)

        if not widget_id:
            return Response(
                {'detail': 'widget_id 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            widget = DashboardWidget.objects.get(id=widget_id)
        except DashboardWidget.DoesNotExist:
            return Response(
                {'detail': '组件不存在'},
                status=status.HTTP_404_NOT_FOUND
            )

        layout_widget, created = LayoutWidget.objects.get_or_create(
            layout=layout,
            widget=widget,
            defaults={'row': row, 'col': col, 'width': width, 'height': height}
        )

        if not created:
            layout_widget.row = row
            layout_widget.col = col
            layout_widget.width = width
            layout_widget.height = height
            layout_widget.save()

        serializer = self.get_serializer(layout)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def remove_widget(self, request, pk=None):
        layout = self.get_object()
        widget_id = request.data.get('widget_id')

        if not widget_id:
            return Response(
                {'detail': 'widget_id 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )

        LayoutWidget.objects.filter(layout=layout, widget_id=widget_id).delete()
        serializer = self.get_serializer(layout)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_layout(self, request, pk=None):
        layout = self.get_object()
        layout_config = request.data.get('layout_config', [])

        with transaction.atomic():
            layout.layout_widgets.all().delete()
            for config in layout_config:
                LayoutWidget.objects.create(
                    layout=layout,
                    widget_id=config['widget_id'],
                    row=config.get('row', 0),
                    col=config.get('col', 0),
                    width=config.get('width', 1),
                    height=config.get('height', 1)
                )

        serializer = self.get_serializer(layout)
        return Response(serializer.data)


class LayoutWidgetViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = LayoutWidget.objects.all()
    serializer_class = LayoutWidgetSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['layout', 'widget']
    ordering_fields = ['row', 'col', 'created_at']
    ordering = ['row', 'col']


class AlertViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [
        'alert_type', 'source', 'is_read', 'is_action_required',
        'is_resolved', 'assigned_to', 'is_demo'
    ]
    search_fields = ['title', 'message']
    ordering_fields = ['created_at', 'is_read', 'is_resolved']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.role == 'member':
            queryset = queryset.filter(assigned_to=user)
        return queryset

    @action(detail=False, methods=['get'])
    def unread(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(is_read=False)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_alerts(self, request):
        queryset = self.filter_queryset(self.get_queryset()).filter(assigned_to=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        alert = self.get_object()
        if alert.is_read:
            return Response({'detail': '告警已标记为已读'})

        alert.is_read = True
        alert.read_at = timezone.now()
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_unread(self, request, pk=None):
        alert = self.get_object()
        alert.is_read = False
        alert.read_at = None
        alert.save()
        serializer = self.get_serializer(alert)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        if alert.is_resolved:
            return Response({'detail': '告警已处理'})

        resolution_notes = request.data.get('resolution_notes', '')

        with transaction.atomic():
            alert.is_resolved = True
            alert.resolved_at = timezone.now()
            alert.resolved_by = request.user
            alert.resolution_notes = resolution_notes
            alert.is_read = True
            if not alert.read_at:
                alert.read_at = timezone.now()
            alert.save()

        serializer = self.get_serializer(alert)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def batch_mark_read(self, request):
        alert_ids = request.data.get('alert_ids', [])
        if not alert_ids:
            return Response(
                {'detail': 'alert_ids 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )

        alerts = self.get_queryset().filter(id__in=alert_ids, is_read=False)
        updated_count = alerts.update(
            is_read=True,
            read_at=timezone.now()
        )

        return Response({
            'detail': f'批量标记已读完成，共{updated_count}条',
            'updated_count': updated_count
        })

    @action(detail=False, methods=['post'])
    def batch_resolve(self, request):
        alert_ids = request.data.get('alert_ids', [])
        resolution_notes = request.data.get('resolution_notes', '')
        if not alert_ids:
            return Response(
                {'detail': 'alert_ids 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )

        alerts = self.get_queryset().filter(id__in=alert_ids, is_resolved=False)
        updated_count = 0

        with transaction.atomic():
            for alert in alerts:
                alert.is_resolved = True
                alert.resolved_at = timezone.now()
                alert.resolved_by = request.user
                alert.resolution_notes = resolution_notes
                alert.is_read = True
                if not alert.read_at:
                    alert.read_at = timezone.now()
                alert.save()
                updated_count += 1

        return Response({
            'detail': f'批量处理完成，共{updated_count}条',
            'updated_count': updated_count
        })

    @action(detail=False, methods=['post'])
    def batch_delete(self, request):
        alert_ids = request.data.get('alert_ids', [])
        if not alert_ids:
            return Response(
                {'detail': 'alert_ids 参数是必需的'},
                status=status.HTTP_400_BAD_REQUEST
            )

        alerts = self.get_queryset().filter(id__in=alert_ids)
        deleted_count, _ = alerts.delete()

        return Response({
            'detail': f'批量删除完成，共{deleted_count}条',
            'deleted_count': deleted_count
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        stats = {
            'total': queryset.count(),
            'unread': queryset.filter(is_read=False).count(),
            'action_required': queryset.filter(is_action_required=True, is_resolved=False).count(),
            'resolved': queryset.filter(is_resolved=True).count(),
            'unresolved': queryset.filter(is_resolved=False).count(),
            'by_type': queryset.values('alert_type').annotate(count=models.Count('id')),
            'by_source': queryset.values('source').annotate(count=models.Count('id'))
        }
        return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_data(request):
    show_demo = getattr(settings, 'SHOW_DEMO_DATA', False)
    today = timezone.now().date()
    start_of_week = today - timedelta(days=today.weekday())
    start_of_month = today.replace(day=1)

    from apps.bookings.models import Booking
    from apps.payments.models import PaymentOrder, CashierShift
    from apps.membership.models import MemberMembership
    from apps.conversion.models import ConversionFunnel, ConversionReminder
    from apps.services.models import ServiceRecord
    from apps.dashboard.models import Alert

    booking_qs = Booking.objects.all()
    if not show_demo:
        booking_qs = booking_qs.filter(is_demo=False)

    payment_qs = PaymentOrder.objects.all()
    if not show_demo:
        payment_qs = payment_qs.filter(is_demo=False, status='paid')

    membership_qs = MemberMembership.objects.all()
    if not show_demo:
        membership_qs = membership_qs.filter(is_demo=False)

    funnel_qs = ConversionFunnel.objects.all()
    if not show_demo:
        funnel_qs = funnel_qs.filter(is_demo=False)

    reminder_qs = ConversionReminder.objects.all()
    if not show_demo:
        reminder_qs = reminder_qs.filter(is_demo=False, is_completed=False)

    service_qs = ServiceRecord.objects.all()
    if not show_demo:
        service_qs = service_qs.filter(is_demo=False)

    alert_qs = Alert.objects.all()
    if not show_demo:
        alert_qs = alert_qs.filter(is_demo=False)

    shift_qs = CashierShift.objects.all()
    if not show_demo:
        shift_qs = shift_qs.filter(is_demo=False)

    bookings_today = booking_qs.filter(booking_date=today).count()
    bookings_this_week = booking_qs.filter(booking_date__gte=start_of_week, booking_date__lte=today).count()
    arrivals_today = booking_qs.filter(booking_date=today, arrival_time__isnull=False).count()
    revenue_today = payment_qs.filter(paid_at__date=today).aggregate(total=models.Sum('paid_amount'))['total'] or 0
    revenue_this_month = payment_qs.filter(paid_at__date__gte=start_of_month).aggregate(total=models.Sum('paid_amount'))['total'] or 0
    new_memberships = membership_qs.filter(created_at__date__gte=start_of_month).count()

    total_bookings_month = booking_qs.filter(booking_date__gte=start_of_month).count()
    if total_bookings_month > 0:
        paid_count = funnel_qs.filter(created_at__date__gte=start_of_month, current_stage__in=['payment', 'membership']).count()
        conversion_rate = round((paid_count / total_bookings_month) * 100, 2)
    else:
        conversion_rate = 0

    pending_reminders = reminder_qs.filter(scheduled_time__lte=timezone.now()).count()
    cashier_discrepancies = shift_qs.filter(cash_discrepancy__gt=0, status__in=['open', 'closed']).count()

    service_status = service_qs.filter(created_at__date=today).values('status').annotate(count=models.Count('id'))
    status_map = {
        'pending': '待服务',
        'in_progress': '服务中',
        'completed': '已完成',
        'cancelled': '已取消',
        'refunded': '已退款'
    }
    service_status_data = [
        {'name': status_map.get(s['status'], s['status']), 'value': s['count']}
        for s in service_status
    ]

    payment_methods = payment_qs.filter(paid_at__date__gte=start_of_month).values('payment_method').annotate(
        count=models.Count('id'),
        amount=models.Sum('paid_amount')
    )
    method_map = {
        'wechat': '微信支付',
        'alipay': '支付宝',
        'cash': '现金',
        'card': '银行卡',
        'points': '积分抵扣',
        'balance': '余额支付',
        'other': '其他'
    }
    payment_methods_data = [
        {
            'name': method_map.get(m['payment_method'], m['payment_method']),
            'value': float(m['amount'] or 0),
            'count': m['count']
        } for m in payment_methods
    ]

    days = []
    amounts = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        amount = payment_qs.filter(paid_at__date=day).aggregate(total=models.Sum('paid_amount'))['total'] or 0
        days.append(day.strftime('%m-%d'))
        amounts.append(float(amount))

    top_services = service_qs.filter(created_at__date__gte=start_of_month).values(
        'service_item__name'
    ).annotate(
        count=models.Count('id'),
        revenue=models.Sum('final_amount')
    ).order_by('-count')[:5]
    top_services_data = [
        {
            'name': s['service_item__name'],
            'count': s['count'],
            'revenue': float(s['revenue'] or 0)
        } for s in top_services
    ]

    alert_stats = {
        'unread': alert_qs.filter(is_read=False).count(),
        'action_required': alert_qs.filter(is_action_required=True, is_resolved=False).count(),
        'unresolved': alert_qs.filter(is_resolved=False).count()
    }

    layout = DashboardLayout.objects.filter(user=request.user, is_default=True).first()
    if not layout:
        layout = DashboardLayout.objects.filter(user=request.user).first()
    layout_data = DashboardLayoutSerializer(layout).data if layout else None

    widgets = DashboardWidget.objects.filter(is_visible=True).order_by('position')
    widgets_data = DashboardWidgetSerializer(widgets, many=True).data

    return Response({
        'summary': {
            'bookings_today': bookings_today,
            'bookings_this_week': bookings_this_week,
            'arrivals_today': arrivals_today,
            'revenue_today': float(revenue_today),
            'revenue_this_month': float(revenue_this_month),
            'new_memberships': new_memberships,
            'conversion_rate': conversion_rate,
            'pending_reminders': pending_reminders,
            'cashier_discrepancies': cashier_discrepancies
        },
        'service_status': service_status_data,
        'payment_methods': payment_methods_data,
        'revenue_trend': {
            'days': days,
            'amounts': amounts
        },
        'top_services': top_services_data,
        'alerts': alert_stats,
        'layout': layout_data,
        'widgets': widgets_data,
        'generated_at': timezone.now().isoformat()
    })
