from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Q
from .models import Book, BookCopy, Category, Theme, BookStatus
from .serializers import (
    BookListSerializer, BookDetailSerializer, BookCopySerializer,
    CategorySerializer, ThemeSerializer
)
from apps.common.permissions import IsAdminOrLibrarian
from apps.common.tasks import cancel_reservations_for_off_shelf_book


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(is_deleted=False)
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrLibrarian()]


class ThemeViewSet(viewsets.ModelViewSet):
    queryset = Theme.objects.filter(is_deleted=False)
    serializer_class = ThemeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrLibrarian()]


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.filter(is_deleted=False)
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return BookDetailSerializer
        return BookListSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrLibrarian()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        category = self.request.query_params.get('category')
        theme = self.request.query_params.get('theme')
        status = self.request.query_params.get('status')
        can_borrow = self.request.query_params.get('can_borrow')
        age = self.request.query_params.get('age')
        search = self.request.query_params.get('search')
        
        if category:
            queryset = queryset.filter(category_id=category)
        if theme:
            queryset = queryset.filter(themes__id=theme)
        if status:
            queryset = queryset.filter(status=status)
        if can_borrow is not None:
            queryset = queryset.filter(can_borrow=(can_borrow.lower() == 'true'))
        if age:
            age = int(age)
            queryset = queryset.filter(age_min__lte=age, age_max__gte=age)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(author__icontains=search) |
                Q(isbn__icontains=search)
            )
        
        return queryset.distinct()
    
    @action(detail=True, methods=['post'])
    def off_shelf(self, request, pk=None):
        book = self.get_object()
        book.status = BookStatus.OFF_SHELF
        book.can_borrow = False
        book.save()
        
        cancel_reservations_for_off_shelf_book.delay(book.id)
        
        serializer = self.get_serializer(book)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def on_shelf(self, request, pk=None):
        book = self.get_object()
        book.status = BookStatus.AVAILABLE
        book.can_borrow = True
        book.save()
        
        serializer = self.get_serializer(book)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        from apps.common.exporters import ExcelExporter
        
        queryset = self.filter_queryset(self.get_queryset())
        exporter = ExcelExporter('绘本列表')
        headers = ['ID', 'ISBN', '书名', '作者', '出版社', '分类', '状态', '可外借', '馆藏总数', '可借数量', '馆藏位置']
        exporter.set_headers(headers)
        
        rows = []
        for book in queryset:
            rows.append([
                book.id,
                book.isbn,
                book.title,
                book.author,
                book.publisher,
                book.category.name if book.category else '',
                book.get_status_display(),
                '是' if book.can_borrow else '否',
                book.total_copies,
                book.available_copies,
                book.location,
            ])
        exporter.add_rows(rows)
        return exporter.get_response()


class BookCopyViewSet(viewsets.ModelViewSet):
    queryset = BookCopy.objects.filter(is_deleted=False)
    serializer_class = BookCopySerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminOrLibrarian()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        book_id = self.request.query_params.get('book_id')
        status = self.request.query_params.get('status')
        
        if book_id:
            queryset = queryset.filter(book_id=book_id)
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset
