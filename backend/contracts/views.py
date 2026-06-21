from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from datetime import date, timedelta
from .models import FrameworkContract, ContractPrice, PriceHistory, ContractRenewal
from .serializers import (
    FrameworkContractSerializer, ContractPriceSerializer,
    PriceHistorySerializer, ContractRenewalSerializer
)
from users.permissions import IsProcurementManagerOrReadOnly, IsProjectManagerOrAdmin, IsProcurementOrFinanceOrAdmin


class FrameworkContractViewSet(viewsets.ModelViewSet):
    queryset = FrameworkContract.objects.select_related(
        'supplier', 'project_manager', 'created_by'
    ).prefetch_related('categories', 'specifications', 'prices')
    serializer_class = FrameworkContractSerializer
    permission_classes = [IsAuthenticated, IsProcurementManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['supplier', 'project_manager', 'status', 'categories', 'payment_terms']
    search_fields = ['contract_number', 'title', 'supplier__name']
    ordering_fields = ['start_date', 'end_date', 'total_amount', 'created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        days = int(request.query_params.get('days', 30))
        today = date.today()
        cutoff = today + timedelta(days=days)
        contracts = self.get_queryset().filter(
            status__in=['active', 'expiring_soon'],
            end_date__gte=today,
            end_date__lte=cutoff
        ).order_by('end_date')
        serializer = self.get_serializer(contracts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def status_summary(self, request):
        summary = FrameworkContract.objects.values('status').annotate(
            count=models.Count('id'),
            total_amount=models.Sum('total_amount')
        )
        return Response(summary)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsProcurementOrFinanceOrAdmin])
    def submit_for_approval(self, request, pk=None):
        contract = self.get_object()
        contract.status = 'pending_approval'
        contract.save()
        return Response({'status': '已提交审批'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsProjectManagerOrAdmin])
    def create_renewal(self, request, pk=None):
        contract = self.get_object()
        existing = ContractRenewal.objects.filter(
            original_contract=contract, decision='pending'
        ).first()
        if existing:
            return Response(
                {'error': '该合同已有待处理的续签记录', 'renewal_id': existing.id},
                status=status.HTTP_400_BAD_REQUEST
            )
        renewal = ContractRenewal.objects.create(
            original_contract=contract,
            renewal_recommendation=request.data.get('renewal_recommendation', ''),
            decision='pending',
            handled_by=request.user
        )
        return Response(ContractRenewalSerializer(renewal).data, status=status.HTTP_201_CREATED)


class ContractPriceViewSet(viewsets.ModelViewSet):
    queryset = ContractPrice.objects.select_related('contract', 'specification', 'created_by')
    serializer_class = ContractPriceSerializer
    permission_classes = [IsAuthenticated, IsProcurementManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['contract', 'specification', 'is_active']
    ordering_fields = ['effective_date', 'unit_price', 'created_at']

    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        PriceHistory.objects.create(
            specification=instance.specification,
            contract=instance.contract,
            unit_price=instance.unit_price,
            price_date=instance.effective_date or date.today(),
            source='contract',
            change_reason='合同定价',
            recorded_by=self.request.user
        )

    def perform_update(self, serializer):
        old_price = self.get_object().unit_price
        instance = serializer.save()
        if old_price != instance.unit_price:
            PriceHistory.objects.create(
                specification=instance.specification,
                contract=instance.contract,
                unit_price=instance.unit_price,
                price_date=date.today(),
                source='contract',
                change_reason=f'价格调整: 原 {old_price} → {instance.unit_price}',
                recorded_by=self.request.user
            )


class PriceHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PriceHistory.objects.select_related('specification', 'contract', 'recorded_by')
    serializer_class = PriceHistorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['specification', 'contract', 'source']
    ordering_fields = ['price_date', 'unit_price']

    @action(detail=False, methods=['get'])
    def fluctuation(self, request):
        spec_id = request.query_params.get('specification')
        months = int(request.query_params.get('months', 12))
        from django.db.models.functions import TruncMonth
        if not spec_id:
            return Response([])
        data = PriceHistory.objects.filter(
            specification_id=spec_id
        ).annotate(
            month=TruncMonth('price_date')
        ).values('month').annotate(
            avg_price=models.Avg('unit_price'),
            min_price=models.Min('unit_price'),
            max_price=models.Max('unit_price')
        ).order_by('month')[:months]
        return Response(list(data))


class ContractRenewalViewSet(viewsets.ModelViewSet):
    queryset = ContractRenewal.objects.select_related('original_contract', 'new_contract', 'handled_by')
    serializer_class = ContractRenewalSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['original_contract', 'decision']
    ordering_fields = ['created_at', 'handled_date']

    def get_permissions(self):
        if self.action == 'handle':
            return [IsAuthenticated(), IsProjectManagerOrAdmin()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def handle(self, request, pk=None):
        renewal = self.get_object()
        decision = request.data.get('decision')
        reason = request.data.get('decision_reason', '')
        new_contract_id = request.data.get('new_contract')

        if decision not in ['renewed', 'not_renewed', 'pending']:
            return Response({'error': '无效的决策类型'}, status=status.HTTP_400_BAD_REQUEST)

        if decision == 'renewed' and not new_contract_id:
            return Response({'error': '续签决策需要指定新合同ID'}, status=status.HTTP_400_BAD_REQUEST)

        renewal.decision = decision
        renewal.decision_reason = reason
        renewal.handled_by = request.user
        renewal.handled_date = date.today()

        if new_contract_id:
            renewal.new_contract_id = new_contract_id
            renewal.original_contract.status = 'expired'
            renewal.original_contract.save()
            if decision == 'renewed':
                new_contract = FrameworkContract.objects.filter(id=new_contract_id).first()
                if new_contract:
                    for price in new_contract.prices.all():
                        price_date = new_contract.start_date or date.today()
                        PriceHistory.objects.update_or_create(
                            specification=price.specification,
                            contract=new_contract,
                            price_date=price_date,
                            defaults={
                                'unit_price': price.unit_price,
                                'source': 'contract',
                                'change_reason': f'续签合同: {new_contract.contract_number}',
                                'recorded_by': request.user
                            }
                        )
        elif decision == 'not_renewed':
            renewal.original_contract.status = 'expired'
            renewal.original_contract.save()
        renewal.save()

        try:
            from dashboard.tasks import sync_contract_renewal_to_dashboard
            sync_contract_renewal_to_dashboard.delay(renewal.id)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f'续签同步看板任务启动失败: {e}')

        return Response(self.get_serializer(renewal).data)
