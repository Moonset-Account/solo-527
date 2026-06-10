from datetime import date, datetime, timedelta

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.inventory.models import Inventory, InventoryConflict, SpecialPricing
from apps.inventory.serializers import (
    InventoryBatchUpdateSerializer,
    InventoryCalendarSerializer,
    InventoryConflictSerializer,
    InventorySerializer,
    SpecialPricingSerializer,
)
from apps.inventory.services import InventoryService


class CanManageInventory(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role in ['super_admin', 'host', 'operator']:
            return True
        return request.method in permissions.SAFE_METHODS


class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [permissions.IsAuthenticated, CanManageInventory]

    def get_permissions(self):
        if self.action in ['calendar', 'check_availability']:
            return [permissions.AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        room_id = request.query_params.get('room_id')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if not room_id or not start_date_str or not end_date_str:
            return Response(
                {'error': '缺少必要参数: room_id, start_date, end_date'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': '日期格式错误，请使用 YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )

        calendar_data = InventoryService.get_calendar_data(room_id, start_date, end_date)
        serializer = InventoryCalendarSerializer(calendar_data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def check_availability(self, request):
        room_id = request.query_params.get('room_id')
        check_in_str = request.query_params.get('check_in')
        check_out_str = request.query_params.get('check_out')

        if not room_id or not check_in_str or not check_out_str:
            return Response(
                {'error': '缺少必要参数: room_id, check_in, check_out'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            check_in_date = datetime.strptime(check_in_str, '%Y-%m-%d').date()
            check_out_date = datetime.strptime(check_out_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': '日期格式错误，请使用 YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = InventoryService.check_availability(room_id, check_in_date, check_out_date)
        return Response(result)

    @action(detail=False, methods=['put'])
    def batch_update(self, request):
        serializer = InventoryBatchUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        updated_items, conflicts = InventoryService.batch_update(
            room_id=data['room_id'],
            start_date=data['start_date'],
            end_date=data['end_date'],
            status=data.get('status'),
            price=data.get('price'),
            is_locked=data.get('is_locked')
        )

        return Response({
            'updated': len(updated_items),
            'conflicts': conflicts,
            'has_conflicts': len(conflicts) > 0
        })


class InventoryConflictViewSet(viewsets.ModelViewSet):
    queryset = InventoryConflict.objects.all()
    serializer_class = InventoryConflictSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageInventory]
    filterset_fields = ['room', 'is_resolved', 'severity', 'conflict_type']

    def get_queryset(self):
        queryset = super().get_queryset()
        unresolved = self.request.query_params.get('unresolved')
        if unresolved == 'true':
            queryset = queryset.filter(is_resolved=False)
        return queryset

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        conflict = self.get_object()
        conflict.is_resolved = True
        conflict.resolved_at = datetime.now()
        conflict.save()
        return Response({'status': 'success'})


class SpecialPricingViewSet(viewsets.ModelViewSet):
    queryset = SpecialPricing.objects.all()
    serializer_class = SpecialPricingSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageInventory]
    filterset_fields = ['room', 'is_active', 'is_holiday']

    def get_queryset(self):
        queryset = super().get_queryset()
        room_id = self.request.query_params.get('room_id')
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        return queryset
