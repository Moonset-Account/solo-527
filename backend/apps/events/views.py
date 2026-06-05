from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from datetime import datetime
from .models import Event, EventType, EventRegistration, EventTicket
from .serializers import (
    EventSerializer, EventListSerializer, EventTypeSerializer,
    EventRegistrationSerializer, EventTicketSerializer, CheckInSerializer
)
from apps.core.permissions import IsAdminOrManager
import qrcode
from io import BytesIO
from django.core.files.base import ContentFile
import uuid


class EventTypeViewSet(viewsets.ModelViewSet):
    queryset = EventType.objects.filter(is_active=True)
    serializer_class = EventTypeSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrManager()]


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.filter(is_active=True)
    filterset_fields = ['status', 'event_type']
    search_fields = ['title', 'location', 'host', 'speaker']
    ordering_fields = ['start_time', 'created_at', 'fee']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return EventListSerializer
        return EventSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'register', 'check_availability']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrManager()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(start_time__gte=start_date)
        if end_date:
            queryset = queryset.filter(end_time__lte=end_date)
        
        upcoming = self.request.query_params.get('upcoming')
        if upcoming == 'true':
            queryset = queryset.filter(start_time__gte=timezone.now())
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def register(self, request, pk=None):
        event = self.get_object()
        member_id = request.data.get('member_id')
        
        if not event.is_registration_open:
            return Response({'error': '活动报名已关闭或名额已满'}, status=400)
        
        if EventRegistration.objects.filter(event=event, member_id=member_id).exists():
            return Response({'error': '您已报名此活动'}, status=400)
        
        with transaction.atomic():
            registration = EventRegistration.objects.create(
                event=event,
                member_id=member_id,
                status=EventRegistration.STATUS_CONFIRMED,
                amount_paid=event.fee,
                points_used=event.points_required
            )
            
            ticket_no = f'T{datetime.now().strftime("%Y%m%d%H%M%S")}{uuid.uuid4().hex[:6].upper()}'
            ticket = EventTicket.objects.create(
                registration=registration,
                ticket_no=ticket_no
            )
            
            qr_img = qrcode.make(ticket_no)
            buffer = BytesIO()
            qr_img.save(buffer, format='PNG')
            ticket.qr_code.save(f'{ticket_no}.png', ContentFile(buffer.getvalue()), save=False)
            ticket.save()
            
            registration.qr_code = ticket.qr_code
            registration.save()
            
            event.registered_count += 1
            event.save()
        
        return Response(EventRegistrationSerializer(registration).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def check_availability(self, request, pk=None):
        event = self.get_object()
        return Response({
            'is_registration_open': event.is_registration_open,
            'available_slots': event.available_slots,
            'max_participants': event.max_participants,
            'registered_count': event.registered_count
        })
    
    @action(detail=True, methods=['post'], serializer_class=CheckInSerializer)
    def check_in(self, request, pk=None):
        if not request.user.is_authenticated:
            return Response({'error': '请先登录'}, status=401)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        registration = None
        if data.get('ticket_no'):
            try:
                ticket = EventTicket.objects.get(ticket_no=data['ticket_no'])
                registration = ticket.registration
            except EventTicket.DoesNotExist:
                return Response({'error': '门票不存在'}, status=404)
        elif data.get('registration_id'):
            try:
                registration = EventRegistration.objects.get(id=data['registration_id'])
            except EventRegistration.DoesNotExist:
                return Response({'error': '报名记录不存在'}, status=404)
        
        if not registration:
            return Response({'error': '请提供票号或报名ID'}, status=400)
        
        if registration.event_id != pk:
            return Response({'error': '票号与活动不匹配'}, status=400)
        
        if registration.status == EventRegistration.STATUS_CHECKED_IN:
            return Response({'error': '已签到，请勿重复签到'}, status=400)
        
        if registration.status in [EventRegistration.STATUS_CANCELLED, EventRegistration.STATUS_NO_SHOW]:
            return Response({'error': '报名已取消或标记为未出席'}, status=400)
        
        registration.status = EventRegistration.STATUS_CHECKED_IN
        registration.check_in_time = timezone.now()
        registration.save()
        
        event = registration.event
        event.checked_in_count += 1
        event.save()
        
        return Response({'message': '签到成功', 'member_name': registration.member.name})


class EventRegistrationViewSet(viewsets.ModelViewSet):
    queryset = EventRegistration.objects.all()
    serializer_class = EventRegistrationSerializer
    filterset_fields = ['status', 'event', 'member']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrManager()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        member_id = self.request.query_params.get('member_id')
        if member_id:
            queryset = queryset.filter(member_id=member_id)
        return queryset
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        registration = self.get_object()
        if registration.status not in [EventRegistration.STATUS_PENDING, EventRegistration.STATUS_CONFIRMED]:
            return Response({'error': '当前状态不能取消'}, status=400)
        
        event = registration.event
        if event.cancellation_deadline and timezone.now() > event.cancellation_deadline:
            return Response({'error': '已超过取消截止时间'}, status=400)
        
        with transaction.atomic():
            registration.status = EventRegistration.STATUS_CANCELLED
            registration.save()
            
            event.registered_count = max(0, event.registered_count - 1)
            event.save()
        
        return Response({'message': '取消成功'})


class EventTicketViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EventTicket.objects.all()
    serializer_class = EventTicketSerializer
    permission_classes = [permissions.IsAuthenticated]
