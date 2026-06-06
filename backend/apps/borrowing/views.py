from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from .models import BorrowRecord, BorrowStatus, Reservation
from .serializers import (
    BorrowRecordSerializer, BorrowRecordCreateSerializer, BorrowTransitionSerializer,
    ReservationSerializer, ReservationCreateSerializer
)
from apps.common.permissions import IsAdminOrLibrarian, IsOwnerOrAdmin
from apps.books.models import BookCopy
from apps.accounts.models import Family
from apps.common.tasks import send_notification


class BorrowRecordViewSet(viewsets.ModelViewSet):
    queryset = BorrowRecord.objects.filter(is_deleted=False)
    serializer_class = BorrowRecordSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'transition', 'renew']:
            return [IsAdminOrLibrarian()]
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrLibrarian()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        family_id = self.request.query_params.get('family_id')
        book_id = self.request.query_params.get('book_id')
        status = self.request.query_params.get('status')
        overdue = self.request.query_params.get('overdue')
        
        if family_id:
            queryset = queryset.filter(family_id=family_id)
        if book_id:
            queryset = queryset.filter(book_id=book_id)
        if status:
            queryset = queryset.filter(status=status)
        if overdue == 'true':
            today = timezone.now().date()
            queryset = queryset.filter(due_date__lt=today, status__in=[BorrowStatus.BORROWED, BorrowStatus.OVERDUE])
        
        if self.request.user.role == 'parent':
            queryset = queryset.filter(family__members=self.request.user)
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def create_borrow(self, request):
        serializer = BorrowRecordCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        family = Family.objects.get(id=serializer.validated_data['family_id'])
        book_copy = BookCopy.objects.get(id=serializer.validated_data['book_copy_id'])
        
        can_borrow, msg = family.can_borrow_more()
        if not can_borrow:
            return Response({'error': msg}, status=status.HTTP_400_BAD_REQUEST)
        
        borrow_record = BorrowRecord.objects.create(
            family=family,
            book_copy=book_copy,
            book=book_copy.book,
            borrower=request.user,
            status=BorrowStatus.RESERVED,
            handled_by=request.user,
            max_renew_count=family.level_config.max_renew_count if family.level_config else 1
        )
        borrow_record.transition(BorrowStatus.RESERVED, operator=request.user)
        
        serializer = self.get_serializer(borrow_record)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def transition(self, request, pk=None):
        borrow_record = self.get_object()
        serializer = BorrowTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        new_status = serializer.validated_data['new_status']
        notes = serializer.validated_data.get('notes', '')
        
        try:
            borrow_record.transition(new_status, operator=request.user, notes=notes)
            if notes:
                borrow_record.notes = notes
                borrow_record.save()
            
            serializer = self.get_serializer(borrow_record)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        borrow_record = self.get_object()
        try:
            borrow_record.renew()
            serializer = self.get_serializer(borrow_record)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        from apps.common.exporters import export_borrow_records
        queryset = self.filter_queryset(self.get_queryset())
        return export_borrow_records(queryset)


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.filter(is_deleted=False)
    serializer_class = ReservationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create', 'cancel']:
            return [IsAuthenticated()]
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrLibrarian()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        family_id = self.request.query_params.get('family_id')
        book_id = self.request.query_params.get('book_id')
        status = self.request.query_params.get('status')
        
        if family_id:
            queryset = queryset.filter(family_id=family_id)
        if book_id:
            queryset = queryset.filter(book_id=book_id)
        if status:
            queryset = queryset.filter(status=status)
        
        if self.request.user.role == 'parent':
            queryset = queryset.filter(family__members=self.request.user)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        serializer = ReservationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        family = Family.objects.filter(members=request.user).first()
        if not family:
            return Response({'error': '用户不属于任何家庭'}, status=status.HTTP_400_BAD_REQUEST)
        
        book_id = serializer.validated_data['book_id']
        
        existing = Reservation.objects.filter(
            family=family,
            book_id=book_id,
            status__in=['waiting', 'available'],
            is_deleted=False
        ).first()
        if existing:
            return Response({'error': '您已预约过此书'}, status=status.HTTP_400_BAD_REQUEST)
        
        max_pos = Reservation.objects.filter(
            book_id=book_id,
            status='waiting',
            is_deleted=False
        ).count()
        
        reservation = Reservation.objects.create(
            family=family,
            book_id=book_id,
            reserved_by=request.user,
            queue_position=max_pos + 1
        )
        
        serializer = self.get_serializer(reservation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        reservation = self.get_object()
        
        if request.user.role == 'parent' and reservation.reserved_by != request.user:
            return Response({'error': '无权限取消此预约'}, status=status.HTTP_403_FORBIDDEN)
        
        reservation.cancel()
        serializer = self.get_serializer(reservation)
        return Response(serializer.data)
