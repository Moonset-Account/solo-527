from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import SupplyCategory, Supply, Batch, ScanRecord, StockWarning
from .serializers import (
    SupplyCategorySerializer, SupplySerializer, BatchSerializer,
    ScanRecordSerializer, StockWarningSerializer
)
from .tasks import check_expired_batches, check_low_stock


class SupplyCategoryViewSet(viewsets.ModelViewSet):
    queryset = SupplyCategory.objects.all()
    serializer_class = SupplyCategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    search_fields = ['name']


class SupplyViewSet(viewsets.ModelViewSet):
    queryset = Supply.objects.all()
    serializer_class = SupplySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['supply_type', 'category', 'is_active']
    search_fields = ['name', 'code', 'specification']

    @action(detail=True, methods=['get'])
    def batches(self, request, pk=None):
        supply = self.get_object()
        batches = supply.batch_set.all()
        serializer = BatchSerializer(batches, many=True)
        return Response(serializer.data)


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['supply', 'is_expired', 'supply__supply_type']
    search_fields = ['batch_number', 'supply__name', 'supply__code']

    def get_queryset(self):
        queryset = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        if status_filter == 'expired':
            queryset = queryset.filter(is_expired=True)
        elif status_filter == 'warning':
            from datetime import date, timedelta
            today = date.today()
            warning_date = today + timedelta(days=30)
            queryset = queryset.filter(is_expired=False, expiry_date__lte=warning_date)
        elif status_filter == 'valid':
            from datetime import date, timedelta
            today = date.today()
            warning_date = today + timedelta(days=30)
            queryset = queryset.filter(is_expired=False, expiry_date__gt=warning_date)
        return queryset

    @action(detail=False, methods=['post'])
    def check_expired(self, request):
        task = check_expired_batches.delay()
        return Response({'task_id': task.id}, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['post'])
    def check_single_expired(self, request, pk=None):
        batch = self.get_object()
        is_expired = batch.check_expired()
        return Response({'is_expired': is_expired, 'batch_number': batch.batch_number})


class ScanRecordViewSet(viewsets.ModelViewSet):
    queryset = ScanRecord.objects.all()
    serializer_class = ScanRecordSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['scan_type', 'is_double_confirmed', 'batch__supply']
    search_fields = ['batch__batch_number', 'operator__username']

    def perform_create(self, serializer):
        serializer.save(operator=self.request.user)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        scan = self.get_object()
        try:
            scan.confirm(request.user)
            return Response({'status': 'success', 'message': '确认成功'})
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class StockWarningViewSet(viewsets.ModelViewSet):
    queryset = StockWarning.objects.all()
    serializer_class = StockWarningSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['warning_type', 'warning_level', 'is_handled']
    search_fields = ['supply__name', 'message']
    http_method_names = ['get', 'put', 'patch', 'head', 'options']

    @action(detail=False, methods=['post'])
    def check_stock(self, request):
        task = check_low_stock.delay()
        return Response({'task_id': task.id}, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['post'])
    def handle(self, request, pk=None):
        warning = self.get_object()
        warning.is_handled = True
        warning.handled_by = request.user
        from django.utils import timezone
        warning.handled_at = timezone.now()
        warning.save()
        return Response({'status': 'success', 'message': '预警已处理'})
