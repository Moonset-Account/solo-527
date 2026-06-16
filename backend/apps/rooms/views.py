from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, DateFilter
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import StudyRoom, Seat, SeatReservation, CheckInRecord
from .serializers import (
    StudyRoomSerializer, SeatSerializer,
    SeatReservationSerializer, SeatReservationCreateSerializer,
    CheckInRecordSerializer, CheckInCreateSerializer,
)
from apps.users.models import Role
from apps.audit.utils import log_audit
from apps.audit.models import OperationType


class RoomPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if view.action in ['list', 'retrieve']:
            return True
        if view.action in ['reserve', 'cancel_reservation', 'checkin', 'my_reservations']:
            return True
        return request.user.role in [Role.ADMIN, Role.DORM_MANAGER]


class StudyRoomViewSet(viewsets.ModelViewSet):
    queryset = StudyRoom.objects.all()
    serializer_class = StudyRoomSerializer
    permission_classes = [RoomPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['building', 'floor', 'is_active']
    search_fields = ['name', 'building']
    ordering_fields = ['building', 'floor', 'name']


class SeatViewSet(viewsets.ModelViewSet):
    queryset = Seat.objects.all()
    serializer_class = SeatSerializer
    permission_classes = [RoomPermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['study_room', 'has_power', 'has_window', 'is_active']


class ReservationFilterSet(FilterSet):
    date_from = DateFilter(field_name='date', lookup_expr='gte')
    date_to = DateFilter(field_name='date', lookup_expr='lte')

    class Meta:
        model = SeatReservation
        fields = ['user', 'seat', 'date', 'status']


class SeatReservationViewSet(viewsets.ModelViewSet):
    queryset = SeatReservation.objects.all()
    permission_classes = [RoomPermission]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ReservationFilterSet
    ordering_fields = ['date', 'reserved_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return SeatReservationCreateSerializer
        return SeatReservationSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role in [Role.STUDENT, Role.MAINTENANCE]:
            return qs.filter(user=user)
        if user.role == Role.DORM_MANAGER and user.dorm_building:
            return qs.filter(seat__study_room__building=user.dorm_building)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            reservation = serializer.save(user=request.user)
            log_audit(
                request.user, OperationType.CREATE, '自习室管理',
                f'预约座位 {reservation.seat}',
                content_object=reservation
            )
        return Response(
            SeatReservationSerializer(reservation).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['get'])
    def my(self, request):
        qs = self.get_queryset().filter(user=request.user).order_by('-date', '-reserved_at')
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        reservation = self.get_object()
        if reservation.user != request.user and request.user.role not in [Role.ADMIN, Role.DORM_MANAGER]:
            return Response({'detail': '无权限'}, status=status.HTTP_403_FORBIDDEN)
        if reservation.status not in ['reserved', 'checked_in']:
            return Response({'detail': '当前状态不可取消'}, status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            reservation.status = 'cancelled'
            reservation.cancelled_at = timezone.now()
            reservation.cancelled_by = request.user
            reservation.save()
            log_audit(
                request.user, OperationType.UPDATE, '自习室管理',
                f'取消预约 {reservation.seat}',
                content_object=reservation
            )
        return Response(SeatReservationSerializer(reservation).data)


class CheckInFilterSet(FilterSet):
    created_from = DateFilter(field_name='created_at', lookup_expr='date__gte')
    created_to = DateFilter(field_name='created_at', lookup_expr='date__lte')

    class Meta:
        model = CheckInRecord
        fields = ['user', 'checkin_type']


class CheckInRecordViewSet(viewsets.ModelViewSet):
    queryset = CheckInRecord.objects.all()
    serializer_class = CheckInRecordSerializer
    permission_classes = [RoomPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = CheckInFilterSet
    search_fields = ['user__username', 'user__real_name', 'location']
    ordering_fields = ['created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role in [Role.STUDENT, Role.MAINTENANCE]:
            return qs.filter(user=user)
        return qs

    @action(detail=False, methods=['post'])
    def do_checkin(self, request):
        serializer = CheckInCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        reservation = None
        if data.get('reservation_id'):
            try:
                reservation = SeatReservation.objects.get(id=data['reservation_id'], user=request.user)
                if reservation.status == 'reserved':
                    reservation.status = 'checked_in'
                    reservation.checked_in_at = timezone.now()
                    reservation.save()
            except SeatReservation.DoesNotExist:
                pass
        with transaction.atomic():
            record = CheckInRecord.objects.create(
                user=request.user,
                checkin_type=data['checkin_type'],
                reservation=reservation,
                location=data.get('location', ''),
                remark=data.get('remark', '')
            )
            log_audit(
                request.user, OperationType.CREATE, '自习室管理',
                f'签到成功: {record.get_checkin_type_display()}',
                content_object=record
            )
        return Response(CheckInRecordSerializer(record).data, status=status.HTTP_201_CREATED)
