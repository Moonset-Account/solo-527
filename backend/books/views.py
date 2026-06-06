from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Book
from .serializers import BookSerializer
from members.models import MemberRole

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    filterset_fields = ['status', 'isbn']
    search_fields = ['title', 'author', 'isbn']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'mark_damaged']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    @action(detail=True, methods=['post'])
    def mark_damaged(self, request, pk=None):
        book = self.get_object()
        damage_level = request.data.get('damage_level')
        if not damage_level:
            return Response({'error': '请选择破损程度'}, status=400)
        new_status = book.mark_damaged(damage_level)
        return Response({
            'status': 'success',
            'new_status': new_status,
            'book': BookSerializer(book).data
        })
