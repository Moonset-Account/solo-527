from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from datetime import datetime
from .models import StockIn, StockInItem, StockOut, StockOutItem, StockLog
from .serializers import (
    StockInSerializer, StockOutSerializer, StockLogSerializer
)
from apps.core.permissions import IsAdminOrManager
from apps.books.models import Book


class StockInViewSet(viewsets.ModelViewSet):
    queryset = StockIn.objects.all()
    serializer_class = StockInSerializer
    permission_classes = [IsAdminOrManager]
    filterset_fields = ['status', 'supplier']
    search_fields = ['in_no']
    ordering_fields = ['created_at', 'in_date', 'total_amount']
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        with transaction.atomic():
            items_data = data.pop('items')
            stock_in = StockIn.objects.create(**data)
            
            total_qty = 0
            total_amount = 0
            
            for item_data in items_data:
                book = Book.objects.get(id=item_data['book_id'])
                qty = item_data['quantity']
                cost_price = item_data['cost_price']
                subtotal = cost_price * qty
                
                StockInItem.objects.create(
                    stock_in=stock_in,
                    book=book,
                    quantity=qty,
                    cost_price=cost_price,
                    subtotal=subtotal,
                    batch_no=item_data.get('batch_no', ''),
                    expire_date=item_data.get('expire_date')
                )
                
                qty_before = book.stock_quantity
                book.stock_quantity += qty
                book.cost_price = cost_price
                book.save()
                
                StockLog.objects.create(
                    book=book,
                    type='in',
                    quantity_before=qty_before,
                    quantity_change=qty,
                    quantity_after=book.stock_quantity,
                    related_type='stock_in',
                    related_id=stock_in.id,
                    created_by=request.user
                )
                
                total_qty += qty
                total_amount += subtotal
            
            stock_in.total_quantity = total_qty
            stock_in.total_amount = total_amount
            stock_in.status = StockIn.STATUS_CONFIRMED
            stock_in.in_date = timezone.now()
            stock_in.save()
        
        return Response(StockInSerializer(stock_in).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        stock_in = self.get_object()
        if stock_in.status != StockIn.STATUS_DRAFT:
            return Response({'error': '入库单已确认'}, status=400)
        
        with transaction.atomic():
            for item in stock_in.items.all():
                book = item.book
                qty_before = book.stock_quantity
                book.stock_quantity += item.quantity
                book.save()
                
                StockLog.objects.create(
                    book=book,
                    type='in',
                    quantity_before=qty_before,
                    quantity_change=item.quantity,
                    quantity_after=book.stock_quantity,
                    related_type='stock_in',
                    related_id=stock_in.id,
                    created_by=request.user
                )
            
            stock_in.status = StockIn.STATUS_CONFIRMED
            stock_in.in_date = timezone.now()
            stock_in.save()
        
        return Response({'message': '入库确认成功'})


class StockOutViewSet(viewsets.ModelViewSet):
    queryset = StockOut.objects.all()
    serializer_class = StockOutSerializer
    permission_classes = [IsAdminOrManager]
    filterset_fields = ['status', 'type']
    search_fields = ['out_no']
    ordering_fields = ['created_at', 'out_date', 'total_amount']
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        with transaction.atomic():
            items_data = data.pop('items')
            stock_out = StockOut.objects.create(**data)
            
            total_qty = 0
            total_amount = 0
            
            for item_data in items_data:
                book = Book.objects.get(id=item_data['book_id'])
                qty = item_data['quantity']
                
                if book.stock_quantity < qty:
                    return Response({
                        'error': f'图书《{book.title}》库存不足，当前库存：{book.stock_quantity}'
                    }, status=400)
                
                price = item_data['price']
                subtotal = price * qty
                
                StockOutItem.objects.create(
                    stock_out=stock_out,
                    book=book,
                    quantity=qty,
                    price=price,
                    subtotal=subtotal,
                    remark=item_data.get('remark', '')
                )
                
                qty_before = book.stock_quantity
                book.stock_quantity = max(0, book.stock_quantity - qty)
                book.save()
                
                StockLog.objects.create(
                    book=book,
                    type='out',
                    quantity_before=qty_before,
                    quantity_change=-qty,
                    quantity_after=book.stock_quantity,
                    related_type='stock_out',
                    related_id=stock_out.id,
                    created_by=request.user
                )
                
                total_qty += qty
                total_amount += subtotal
            
            stock_out.total_quantity = total_qty
            stock_out.total_amount = total_amount
            stock_out.status = StockOut.STATUS_CONFIRMED
            stock_out.out_date = timezone.now()
            stock_out.save()
        
        return Response(StockOutSerializer(stock_out).data, status=status.HTTP_201_CREATED)


class StockLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StockLog.objects.all()
    serializer_class = StockLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['type', 'book']
    ordering_fields = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        book_id = self.request.query_params.get('book_id')
        if book_id:
            queryset = queryset.filter(book_id=book_id)
        return queryset[:100]
