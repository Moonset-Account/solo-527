from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from datetime import date, timedelta
from .models import Notification, DashboardWidget, OperationLog
from .serializers import (
    NotificationSerializer, DashboardWidgetSerializer, OperationLogSerializer
)
from contracts.models import FrameworkContract, PriceHistory
from suppliers.models import Supplier, SupplierRisk
from invoices.models import Invoice
from consumables.models import MonthlyUsage
from approvals.models import ApprovalRequest


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.select_related(
        'related_contract', 'handled_by'
    ).prefetch_related('recipients', 'read_by')
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['notification_type', 'priority', 'is_handled']
    ordering_fields = ['priority', 'created_at']

    def get_queryset(self):
        user = self.request.user
        return self.queryset.filter(recipients=user)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        user = request.user
        count = self.get_queryset().filter(
            ~models.Q(read_by=user)
        ).count()
        return Response({'count': count})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        user = request.user
        notifications = self.get_queryset().filter(
            ~models.Q(read_by=user)
        )
        for n in notifications:
            n.read_by.add(user)
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.read_by.add(request.user)
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def handle(self, request, pk=None):
        notification = self.get_object()
        result = request.data.get('handle_result', '')
        notification.is_handled = True
        notification.handled_by = request.user
        notification.handled_at = date.today()
        notification.handle_result = result
        notification.save()
        return Response(self.get_serializer(notification).data)


class DashboardWidgetViewSet(viewsets.ModelViewSet):
    serializer_class = DashboardWidgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DashboardWidget.objects.filter(user=self.request.user).order_by('position')

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        widget_ids = request.data.get('widget_ids', [])
        for idx, wid in enumerate(widget_ids):
            DashboardWidget.objects.filter(id=wid, user=request.user).update(position=idx)
        return Response({'status': 'success'})


class OperationLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = OperationLog.objects.select_related('user')
    serializer_class = OperationLogSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['user', 'module', 'action']
    ordering_fields = ['created_at']


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)
    ninety_days_later = today + timedelta(days=90)
    contract_status = FrameworkContract.objects.values('status').annotate(
        count=models.Count('id'),
        total_amount=models.Sum('total_amount')
    )
    expiring_contracts = FrameworkContract.objects.filter(
        status__in=['active', 'expiring_soon'],
        end_date__gte=today,
        end_date__lte=ninety_days_later
    ).count()
    supplier_risks = SupplierRisk.objects.filter(
        status__in=['open', 'monitoring']
    ).values('risk_level').annotate(count=models.Count('id'))
    invoice_status = Invoice.objects.values('status').annotate(
        count=models.Count('id'),
        total_amount=models.Sum('total_amount')
    )
    pending_approvals = ApprovalRequest.objects.filter(
        status__in=['pending', 'in_progress']
    ).count()
    return Response({
        'contract_status': list(contract_status),
        'expiring_contracts': expiring_contracts,
        'supplier_risks': list(supplier_risks),
        'invoice_status': list(invoice_status),
        'pending_approvals': pending_approvals,
        'total_suppliers': Supplier.objects.count(),
        'total_contracts': FrameworkContract.objects.count(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def price_fluctuation_data(request):
    spec_id = request.query_params.get('specification')
    months = int(request.query_params.get('months', 12))
    from django.db.models.functions import TruncMonth
    queryset = PriceHistory.objects.all()
    if spec_id:
        queryset = queryset.filter(specification_id=spec_id)
    data = queryset.annotate(
        month=TruncMonth('price_date')
    ).values('month', 'specification__name').annotate(
        avg_price=models.Avg('unit_price'),
        min_price=models.Min('unit_price'),
        max_price=models.Max('unit_price')
    ).order_by('month')[:months]
    return Response(list(data))
