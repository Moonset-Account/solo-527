from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Borrow, BorrowStatus
from .serializers import BorrowSerializer
from books.models import Book, BookStatus

class BorrowViewSet(viewsets.ModelViewSet):
    queryset = Borrow.objects.all()
    serializer_class = BorrowSerializer
    filterset_fields = ['status', 'member', 'book']

    def get_permissions(self):
        if self.action in ['create', 'return_book', 'renew', 'my_borrows']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAdminUser()]

    def create(self, request, *args, **kwargs):
        book_id = request.data.get('book')
        member_id = request.data.get('member')
        
        try:
            book = Book.objects.get(id=book_id)
        except Book.DoesNotExist:
            return Response({'error': '绘本不存在'}, status=status.HTTP_404_NOT_FOUND)
        
        if not book.can_borrow():
            return Response({'error': '该绘本当前不可借阅'}, status=status.HTTP_400_BAD_REQUEST)
        
        borrow = Borrow.objects.create(
            book=book,
            member_id=member_id,
            due_date=timezone.now().date() + timedelta(days=14)
        )
        book.status = BookStatus.BORROWED
        book.save()
        
        serializer = self.get_serializer(borrow)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def return_book(self, request, pk=None):
        borrow = self.get_object()
        if borrow.status != BorrowStatus.BORROWED and borrow.status != BorrowStatus.OVERDUE:
            return Response({'error': '该借阅状态无法归还'}, status=400)
        borrow.return_book()
        return Response(BorrowSerializer(borrow).data)

    @action(detail=True, methods=['post'])
    def renew(self, request, pk=None):
        borrow = self.get_object()
        success = borrow.renew()
        if success:
            return Response(BorrowSerializer(borrow).data)
        return Response({'error': '续借失败，可能已超过续借次数或已逾期'}, status=400)

    @action(detail=False, methods=['get'])
    def my_borrows(self, request):
        if not hasattr(request.user, 'member'):
            return Response({'error': '用户信息不存在'}, status=404)
        borrows = Borrow.objects.filter(member=request.user.member).order_by('-borrow_date')
        return Response(BorrowSerializer(borrows, many=True).data)
