from django.conf import settings
from django.utils import timezone
from django.db.models import Sum, Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters import rest_framework as filters
from rest_framework.permissions import IsAuthenticated

from .models import PaymentOrder, PaymentTransaction, CashierShift
from .serializers import (
    PaymentOrderSerializer, PaymentOrderListSerializer,
    PaymentTransactionSerializer, CashierShiftSerializer,
    DiscrepancySerializer, DiscrepancyResolveSerializer,
    PaymentProcessSerializer, ShiftCloseSerializer, ShiftReconcileSerializer
)


class DemoFilterMixin:
    def get_queryset(self):
        queryset = super().get_queryset()
        if not getattr(settings, 'SHOW_DEMO_DATA', False):
            if hasattr(queryset.model, 'is_demo'):
                queryset = queryset.filter(is_demo=False)
        return queryset


class PaymentOrderFilter(filters.FilterSet):
    order_type = filters.CharFilter(field_name='order_type', lookup_expr='exact')
    status = filters.CharFilter(field_name='status', lookup_expr='exact')
    payment_method = filters.CharFilter(field_name='payment_method', lookup_expr='exact')
    has_discrepancy = filters.BooleanFilter(field_name='has_discrepancy')
    discrepancy_resolved = filters.BooleanFilter(field_name='discrepancy_resolved')
    created_from = filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    created_to = filters.DateFilter(field_name='created_at', lookup_expr='date__lte')
    member = filters.NumberFilter(field_name='member', lookup_expr='exact')
    cashier = filters.NumberFilter(field_name='cashier', lookup_expr='exact')

    class Meta:
        model = PaymentOrder
        fields = [
            'order_type', 'status', 'payment_method', 'has_discrepancy',
            'discrepancy_resolved', 'member', 'cashier'
        ]


class PaymentOrderViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = PaymentOrder.objects.all()
    filter_backends = [filters.DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PaymentOrderFilter
    search_fields = ['order_no', 'member__username', 'member__phone', 'transaction_id']
    ordering_fields = ['created_at', 'total_amount', 'paid_amount', 'status']
    ordering = ['-created_at']
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return PaymentOrderListSerializer
        return PaymentOrderSerializer

    @action(detail=True, methods=['post'], url_path='process-payment')
    def process_payment(self, request, pk=None):
        order = self.get_object()
        if order.status != 'pending':
            return Response(
                {'detail': '只有待支付的订单才能进行支付处理'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = PaymentProcessSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        paid_amount = validated_data['paid_amount']
        payment_method = validated_data['payment_method']
        transaction_id = validated_data.get('transaction_id')

        if paid_amount <= 0:
            return Response(
                {'detail': '支付金额必须大于0'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.paid_amount = paid_amount
        order.payment_method = payment_method
        order.transaction_id = transaction_id
        order.paid_at = timezone.now()
        order.cashier = request.user

        if paid_amount >= order.payable_amount:
            order.status = 'paid'
        elif paid_amount > 0:
            order.status = 'partial_refunded'

        order.save()

        PaymentTransaction.objects.create(
            order=order,
            transaction_type='payment',
            amount=paid_amount,
            payment_method=payment_method,
            third_party_transaction_id=transaction_id,
            status='success',
            operator=request.user
        )

        serializer = PaymentOrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='mark-discrepancy')
    def mark_discrepancy(self, request, pk=None):
        order = self.get_object()
        if order.discrepancy_resolved:
            return Response(
                {'detail': '该订单的差异已处理，无法重复标记'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = DiscrepancySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order.has_discrepancy = True
        order.discrepancy_note = serializer.validated_data['discrepancy_note']
        order.save()

        serializer = PaymentOrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='resolve-discrepancy')
    def resolve_discrepancy(self, request, pk=None):
        order = self.get_object()
        if not order.has_discrepancy:
            return Response(
                {'detail': '该订单没有收银差异需要处理'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if order.discrepancy_resolved:
            return Response(
                {'detail': '该订单的差异已处理'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = DiscrepancyResolveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order.discrepancy_resolved = True
        order.discrepancy_resolved_at = timezone.now()
        order.discrepancy_resolved_by = request.user
        order.notes = (order.notes or '') + f"\n差异处理说明: {serializer.validated_data['resolution_note']}"
        order.save()

        from apps.conversion.tasks import generate_daily_report
        report_date = order.paid_at.date() if order.paid_at else timezone.now().date()
        generate_daily_report.delay(report_date)

        serializer = PaymentOrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='refund')
    def refund(self, request, pk=None):
        order = self.get_object()
        if order.status not in ['paid', 'partial_refunded']:
            return Response(
                {'detail': '只有已支付的订单才能退款'},
                status=status.HTTP_400_BAD_REQUEST
            )

        refund_amount = request.data.get('refund_amount', order.paid_amount)
        try:
            refund_amount = float(refund_amount)
        except (TypeError, ValueError):
            return Response(
                {'detail': '退款金额格式错误'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if refund_amount <= 0 or refund_amount > order.paid_amount:
            return Response(
                {'detail': '退款金额必须大于0且不大于实付金额'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.refund_amount += refund_amount
        if order.refund_amount >= order.paid_amount:
            order.status = 'refunded'
        else:
            order.status = 'partial_refunded'
        order.save()

        PaymentTransaction.objects.create(
            order=order,
            transaction_type='refund',
            amount=refund_amount,
            payment_method=order.payment_method or 'other',
            status='success',
            operator=request.user
        )

        serializer = PaymentOrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status != 'pending':
            return Response(
                {'detail': '只有待支付的订单才能取消'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.status = 'cancelled'
        order.save()

        serializer = PaymentOrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PaymentTransactionFilter(filters.FilterSet):
    transaction_type = filters.CharFilter(field_name='transaction_type', lookup_expr='exact')
    payment_method = filters.CharFilter(field_name='payment_method', lookup_expr='exact')
    status = filters.CharFilter(field_name='status', lookup_expr='exact')
    created_from = filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    created_to = filters.DateFilter(field_name='created_at', lookup_expr='date__lte')
    order = filters.NumberFilter(field_name='order', lookup_expr='exact')
    operator = filters.NumberFilter(field_name='operator', lookup_expr='exact')

    class Meta:
        model = PaymentTransaction
        fields = ['transaction_type', 'payment_method', 'status', 'order', 'operator']


class PaymentTransactionViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = PaymentTransaction.objects.all()
    serializer_class = PaymentTransactionSerializer
    filter_backends = [filters.DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PaymentTransactionFilter
    search_fields = ['transaction_no', 'third_party_transaction_id', 'order__order_no']
    ordering_fields = ['created_at', 'amount']
    ordering = ['-created_at']
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        if not getattr(settings, 'SHOW_DEMO_DATA', False):
            queryset = queryset.filter(is_demo=False)
        return queryset


class CashierShiftFilter(filters.FilterSet):
    status = filters.CharFilter(field_name='status', lookup_expr='exact')
    cashier = filters.NumberFilter(field_name='cashier', lookup_expr='exact')
    start_from = filters.DateFilter(field_name='start_time', lookup_expr='date__gte')
    start_to = filters.DateFilter(field_name='start_time', lookup_expr='date__lte')

    class Meta:
        model = CashierShift
        fields = ['status', 'cashier']


class CashierShiftViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = CashierShift.objects.all()
    serializer_class = CashierShiftSerializer
    filter_backends = [filters.DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CashierShiftFilter
    search_fields = ['shift_no', 'cashier__username', 'cashier__phone']
    ordering_fields = ['start_time', 'total_amount', 'orders_count']
    ordering = ['-start_time']
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='open-shift')
    def open_shift(self, request):
        existing_shift = CashierShift.objects.filter(
            cashier=request.user,
            status='open'
        ).first()
        if existing_shift:
            return Response(
                {'detail': '您当前有未交班的班次，请先交班再开新班次', 'shift_id': existing_shift.id},
                status=status.HTTP_400_BAD_REQUEST
            )

        opening_cash = request.data.get('opening_cash', 0)
        try:
            opening_cash = float(opening_cash)
        except (TypeError, ValueError):
            opening_cash = 0

        shift = CashierShift.objects.create(
            cashier=request.user,
            opening_cash=opening_cash,
            status='open',
            start_time=timezone.now()
        )

        serializer = CashierShiftSerializer(shift)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='current-shift')
    def current_shift(self, request):
        shift = CashierShift.objects.filter(
            cashier=request.user,
            status='open'
        ).first()
        if not shift:
            return Response(
                {'detail': '当前没有进行中的班次'},
                status=status.HTTP_404_NOT_FOUND
            )

        orders = PaymentOrder.objects.filter(
            cashier=request.user,
            created_at__gte=shift.start_time,
            status__in=['paid', 'partial_refunded']
        )

        shift.orders_count = orders.count()
        shift.total_amount = orders.aggregate(total=Sum('paid_amount'))['total'] or 0

        cash_orders = orders.filter(payment_method='cash')
        shift.expected_cash = cash_orders.aggregate(total=Sum('paid_amount'))['total'] or 0
        shift.expected_cash += shift.opening_cash

        shift.save()

        serializer = CashierShiftSerializer(shift)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='close-shift')
    def close_shift(self, request, pk=None):
        shift = self.get_object()
        if shift.status != 'open':
            return Response(
                {'detail': '只有营业中的班次才能交班'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if shift.cashier != request.user and request.user.role not in ['admin', 'manager']:
            return Response(
                {'detail': '只有本班收银员或管理员才能交班'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ShiftCloseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        actual_cash = serializer.validated_data['actual_cash']

        orders = PaymentOrder.objects.filter(
            cashier=shift.cashier,
            created_at__gte=shift.start_time,
            created_at__lte=timezone.now(),
            status__in=['paid', 'partial_refunded']
        )

        shift.orders_count = orders.count()
        shift.total_amount = orders.aggregate(total=Sum('paid_amount'))['total'] or 0

        cash_orders = orders.filter(payment_method='cash')
        shift.expected_cash = cash_orders.aggregate(total=Sum('paid_amount'))['total'] or 0
        shift.expected_cash += shift.opening_cash

        shift.actual_cash = actual_cash
        shift.cash_discrepancy = actual_cash - shift.expected_cash
        shift.end_time = timezone.now()
        shift.status = 'closed'
        shift.save()

        serializer = CashierShiftSerializer(shift)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='reconcile')
    def reconcile(self, request, pk=None):
        shift = self.get_object()
        if shift.status != 'closed':
            return Response(
                {'detail': '只有已交班的班次才能对账'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if request.user.role not in ['admin', 'manager']:
            return Response(
                {'detail': '只有管理员或经理才能对账'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ShiftReconcileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        shift.reconciliation_note = serializer.validated_data['reconciliation_note']
        shift.status = 'reconciled'
        shift.save()

        serializer = CashierShiftSerializer(shift)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='shift-summary')
    def shift_summary(self, request, pk=None):
        shift = self.get_object()

        orders = PaymentOrder.objects.filter(
            cashier=shift.cashier,
            created_at__gte=shift.start_time,
            created_at__lte=shift.end_time or timezone.now()
        )

        summary = orders.values('payment_method').annotate(
            count=Count('id'),
            total=Sum('paid_amount')
        )

        order_status_summary = orders.values('status').annotate(
            count=Count('id'),
            total=Sum('paid_amount')
        )

        order_type_summary = orders.values('order_type').annotate(
            count=Count('id'),
            total=Sum('paid_amount')
        )

        discrepancy_orders = orders.filter(has_discrepancy=True).count()

        return Response({
            'shift': CashierShiftSerializer(shift).data,
            'payment_method_summary': list(summary),
            'order_status_summary': list(order_status_summary),
            'order_type_summary': list(order_type_summary),
            'discrepancy_orders': discrepancy_orders,
            'total_orders': orders.count(),
            'total_amount': orders.aggregate(total=Sum('paid_amount'))['total'] or 0
        })
