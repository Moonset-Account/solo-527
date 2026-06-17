from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Ticket, TicketNote, TicketHistory
from .serializers import (
    TicketSerializer, TicketDetailSerializer, TicketNoteSerializer,
    TicketHistorySerializer, TicketAssignSerializer, TicketEscalateSerializer,
    TicketResolveSerializer, TicketNoteCreateSerializer, DashboardStatsSerializer
)
from .services import TicketService, TicketHistoryService
from apps.core.views import BaseViewSet


class TicketViewSet(BaseViewSet):
    queryset = TicketService.get_queryset_with_related()
    serializer_class = TicketSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'type', 'assignee', 'creator', 'is_overdue']
    search_fields = ['ticket_no', 'title', 'description', 'customer_name',
                     'customer_phone', 'order_no', 'product_name']
    ordering_fields = ['created_at', 'priority', 'status', 'sla_deadline', 'ticket_no']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TicketDetailSerializer
        return TicketSerializer

    def perform_create(self, serializer):
        data = serializer.validated_data
        ticket = TicketService.create_ticket(data, self.request.user)
        TicketHistoryService.create_history(
            ticket, self.request.user, '创建工单',
            f'创建工单: {ticket.title}', 'status', '', ticket.get_status_display()
        )
        serializer.instance = ticket

    @action(detail=True, methods=['post'], url_path='assign')
    def assign(self, request, pk=None):
        ticket = self.get_object()
        serializer = TicketAssignSerializer(data=request.data)
        if serializer.is_valid():
            ticket = TicketService.assign_ticket(
                ticket, serializer.validated_data['assignee_id'], request.user
            )
            return Response({
                'status': 'success',
                'message': '工单已分派',
                'ticket': TicketSerializer(ticket, context={'request': request}).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='escalate')
    def escalate(self, request, pk=None):
        ticket = self.get_object()
        serializer = TicketEscalateSerializer(data=request.data)
        if serializer.is_valid():
            ticket = TicketService.escalate_ticket(
                ticket,
                serializer.validated_data['escalated_to_id'],
                serializer.validated_data['escalation_reason'],
                request.user
            )
            return Response({
                'status': 'success',
                'message': '工单已升级',
                'ticket': TicketSerializer(ticket, context={'request': request}).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='resolve')
    def resolve(self, request, pk=None):
        ticket = self.get_object()
        serializer = TicketResolveSerializer(data=request.data)
        if serializer.is_valid():
            ticket = TicketService.resolve_ticket(
                ticket,
                serializer.validated_data['resolution'],
                serializer.validated_data['status'],
                request.user
            )
            return Response({
                'status': 'success',
                'message': '工单已完结',
                'ticket': TicketSerializer(ticket, context={'request': request}).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='notes')
    def add_note(self, request, pk=None):
        ticket = self.get_object()
        serializer = TicketNoteCreateSerializer(data=request.data)
        if serializer.is_valid():
            note = TicketService.add_note(
                ticket,
                serializer.validated_data['content'],
                serializer.validated_data['is_internal'],
                request.user
            )
            return Response(
                TicketNoteSerializer(note, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TicketNoteViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TicketNote.objects.select_related('ticket', 'created_by').all()
    serializer_class = TicketNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ticket', 'is_internal']
    ordering_fields = ['created_at']


class TicketHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TicketHistory.objects.select_related('ticket', 'actor').all()
    serializer_class = TicketHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ticket', 'action', 'actor']
    ordering_fields = ['created_at']


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    stats = TicketService.get_dashboard_stats()
    serializer = DashboardStatsSerializer(data=stats)
    if serializer.is_valid():
        return Response({
            'success': True,
            'message': '获取统计数据成功',
            'data': serializer.data
        })
    return Response({
        'success': False,
        'message': '获取统计数据失败',
        'data': None
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
