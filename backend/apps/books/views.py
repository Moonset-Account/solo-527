from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction, models
from .models import Book, Supplier, Category, BookImage
from .serializers import (
    BookSerializer, BookListSerializer, SupplierSerializer,
    CategorySerializer, StockAdjustSerializer, BookImageSerializer
)
from apps.inventory.models import StockLog


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.filter(is_active=True)
    filterset_fields = ['status', 'category', 'supplier', 'allow_reservation']
    search_fields = ['isbn', 'title', 'author', 'publisher']
    ordering_fields = ['created_at', 'price', 'stock_quantity', 'title']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return BookListSerializer
        return BookSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        isbn = self.request.query_params.get('isbn')
        if isbn:
            queryset = queryset.filter(isbn__icontains=isbn)
        return queryset
    
    @action(detail=True, methods=['post'], serializer_class=StockAdjustSerializer)
    def adjust_stock(self, request, pk=None):
        book = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        qty_before = book.stock_quantity
        
        with transaction.atomic():
            if data['type'] == 'add':
                book.stock_quantity += data['quantity']
            elif data['type'] == 'subtract':
                book.stock_quantity = max(0, book.stock_quantity - data['quantity'])
            elif data['type'] == 'set':
                book.stock_quantity = max(0, data['quantity'])
            
            book.save()
            
            StockLog.objects.create(
                book=book,
                type='adjust',
                quantity_before=qty_before,
                quantity_change=book.stock_quantity - qty_before,
                quantity_after=book.stock_quantity,
                remark=data.get('remark', ''),
                created_by=request.user
            )
        
        return Response({
            'message': '库存调整成功',
            'stock_quantity': book.stock_quantity
        })
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        books = Book.objects.filter(
            is_active=True,
            stock_quantity__lte=models.F('low_stock_threshold')
        )
        serializer = BookListSerializer(books, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search_by_isbn(self, request):
        isbn = request.query_params.get('isbn', '')
        if not isbn:
            return Response({'error': '请输入ISBN'}, status=400)
        try:
            book = Book.objects.get(isbn=isbn, is_active=True)
            return Response(BookSerializer(book).data)
        except Book.DoesNotExist:
            return Response({'error': '图书不存在'}, status=404)


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.filter(is_active=True)
    serializer_class = SupplierSerializer
    search_fields = ['name', 'contact_person', 'phone']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_active=True, parent__isnull=True)
    serializer_class = CategorySerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        categories = Category.objects.filter(is_active=True, parent__isnull=True)
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)


class BookImageViewSet(viewsets.ModelViewSet):
    queryset = BookImage.objects.all()
    serializer_class = BookImageSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]
