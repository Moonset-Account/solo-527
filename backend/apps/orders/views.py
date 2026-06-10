from datetime import datetime

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.orders.models import Order
from apps.orders.serializers import (
    ConversionFunnelSerializer,
    ConversionStageUpdateSerializer,
    OrderCreateSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
    PaymentSerializer,
)
from apps.orders.services import OrderService


class CanManageOrders(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role in ['super_admin', 'host', 'operator', 'receptionist']:
            return True
        return request.method in permissions.SAFE_METHODS

    def has_object_permission(self, request, view, obj):
        if request.user.role in ['super_admin', 'host', 'operator']:
            return True
        return request.method in permissions.SAFE_METHODS


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related('room', 'room__property', 'handled_by').prefetch_related(
        'timeline', 'payments'
    )
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageOrders]
    filterset_fields = ['status', 'conversion_stage', 'source', 'room']
    search_fields = ['order_no', 'guest_name', 'guest_phone']
    ordering_fields = ['created_at', 'check_in_date', 'total_amount']

    def get_permissions(self):
        if self.action in ['create', 'retrieve']:
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        stage = self.request.query_params.get('conversion_stage')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if status:
            queryset = queryset.filter(status=status)
        if stage:
            queryset = queryset.filter(conversion_stage=stage)
        if start_date:
            queryset = queryset.filter(check_in_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(check_in_date__lte=end_date)

        return queryset

    @action(detail=False, methods=['post'])
    def book(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user if request.user.is_authenticated else None
        order = OrderService.create_order(serializer.validated_data, user)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        order = OrderService.update_order_status(
            order,
            data['status'],
            data.get('remarks', ''),
            request.user
        )
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    def update_conversion_stage(self, request, pk=None):
        order = self.get_object()
        serializer = ConversionStageUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        order = OrderService.update_conversion_stage(
            order,
            data['stage'],
            data.get('remarks', ''),
            request.user
        )
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        order = self.get_object()
        serializer = PaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        payment = OrderService.add_payment(
            order,
            data['amount'],
            data['method'],
            data.get('transaction_no', ''),
            data.get('remarks', ''),
            request.user
        )
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def conversion_funnel(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

        funnel = OrderService.get_conversion_funnel(start_date, end_date)
        serializer = ConversionFunnelSerializer(funnel, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        today = datetime.now().date()
        total_orders = Order.objects.count()
        today_orders = Order.objects.filter(created_at__date=today).count()
        pending_orders = Order.objects.filter(status='pending').count()
        confirmed_orders = Order.objects.filter(status='confirmed').count()
        checked_in_orders = Order.objects.filter(status='checked_in').count()

        total_revenue = sum(o.total_amount for o in Order.objects.filter(status__in=['checked_out', 'confirmed']))
        today_revenue = sum(
            o.total_amount for o in Order.objects.filter(
                status__in=['checked_out', 'confirmed'],
                updated_at__date=today
            )
        )

        return Response({
            'total_orders': total_orders,
            'today_orders': today_orders,
            'pending_orders': pending_orders,
            'confirmed_orders': confirmed_orders,
            'checked_in_orders': checked_in_orders,
            'total_revenue': float(total_revenue),
            'today_revenue': float(today_revenue),
        })
