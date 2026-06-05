from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from .models import Reservation, ReservationItem
from .serializers import (
    ReservationSerializer, ReservationCreateSerializer,
    ReservationCancelSerializer
)
from apps.books.models import Book
from apps.core.permissions import IsAdminOrManager


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all()
    serializer_class = ReservationSerializer
    filterset_fields = ['status', 'member']
    search_fields = ['reservation_no', 'contact_name', 'contact_phone']
    ordering_fields = ['created_at', 'expire_at']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'create', 'check_availability']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrManager()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        only_expired = self.request.query_params.get('only_expired')
        if only_expired == 'true':
            queryset = queryset.filter(
                status__in=[Reservation.STATUS_PENDING, Reservation.STATUS_CONFIRMED],
                expire_at__lte=timezone.now()
            )
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReservationCreateSerializer
        return ReservationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        with transaction.atomic():
            expire_hours = data.get('expire_hours', getattr(settings, 'RESERVATION_EXPIRE_HOURS', 48))
            reservation = Reservation.objects.create(
                member_id=data['member_id'],
                contact_name=data['contact_name'],
                contact_phone=data['contact_phone'],
                remark=data.get('remark', ''),
                expire_at=timezone.now() + timedelta(hours=expire_hours)
            )
            
            total_qty = 0
            total_amount = 0
            
            for item in data['items']:
                book = Book.objects.get(id=item['book_id'])
                
                if book.available_quantity < item['quantity']:
                    return Response({
                        'error': f'图书《{book.title}》库存不足，可预留数量：{book.available_quantity}'
                    }, status=400)
                
                if not book.allow_reservation:
                    return Response({
                        'error': f'图书《{book.title}》不允许预留'
                    }, status=400)
                
                subtotal = book.price * item['quantity']
                ReservationItem.objects.create(
                    reservation=reservation,
                    book=book,
                    quantity=item['quantity'],
                    price=book.price,
                    subtotal=subtotal
                )
                
                book.reserved_quantity += item['quantity']
                book.save()
                
                total_qty += item['quantity']
                total_amount += subtotal
            
            reservation.total_quantity = total_qty
            reservation.total_amount = total_amount
            reservation.save()
        
        return Response(ReservationSerializer(reservation).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        reservation = self.get_object()
        if reservation.status not in [Reservation.STATUS_PENDING]:
            return Response({'error': '当前状态不能确认'}, status=400)
        
        reservation.status = Reservation.STATUS_CONFIRMED
        reservation.confirmed_at = timezone.now()
        reservation.save()
        return Response({'message': '确认成功'})
    
    @action(detail=True, methods=['post'], serializer_class=ReservationCancelSerializer)
    def cancel(self, request, pk=None):
        reservation = self.get_object()
        if reservation.status in [Reservation.STATUS_COMPLETED, Reservation.STATUS_CANCELLED, Reservation.STATUS_EXPIRED]:
            return Response({'error': '当前状态不能取消'}, status=400)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            for item in reservation.items.all():
                book = item.book
                book.reserved_quantity = max(0, book.reserved_quantity - item.quantity)
                book.save()
            
            reservation.status = Reservation.STATUS_CANCELLED
            reservation.cancelled_at = timezone.now()
            reservation.cancelled_reason = serializer.validated_data.get('reason', '')
            reservation.save()
        
        return Response({'message': '取消成功'})
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        reservation = self.get_object()
        if reservation.status not in [Reservation.STATUS_CONFIRMED]:
            return Response({'error': '当前状态不能完成'}, status=400)
        
        with transaction.atomic():
            for item in reservation.items.all():
                book = item.book
                if not item.picked_up:
                    book.reserved_quantity = max(0, book.reserved_quantity - item.quantity)
                    book.stock_quantity = max(0, book.stock_quantity - item.quantity)
                    book.save()
                    item.picked_up = True
                    item.picked_up_at = timezone.now()
                    item.save()
            
            reservation.status = Reservation.STATUS_COMPLETED
            reservation.completed_at = timezone.now()
            reservation.save()
        
        return Response({'message': '完成成功'})
    
    @action(detail=False, methods=['post'])
    def check_availability(self, request):
        book_id = request.data.get('book_id')
        quantity = request.data.get('quantity', 1)
        
        if not book_id:
            return Response({'error': '请选择图书'}, status=400)
        
        try:
            book = Book.objects.get(id=book_id, is_active=True)
        except Book.DoesNotExist:
            return Response({'error': '图书不存在'}, status=404)
        
        available = book.available_quantity >= quantity and book.allow_reservation
        
        return Response({
            'available': available,
            'available_quantity': book.available_quantity,
            'allow_reservation': book.allow_reservation,
            'book_title': book.title
        })
