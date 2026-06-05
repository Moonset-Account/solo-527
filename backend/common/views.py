from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from common.permissions import IsAdmin
from .audit import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ['action', 'model_name', 'user']
    search_fields = ['detail', 'model_name', 'object_id']

    def get_queryset(self):
        return AuditLog.objects.select_related('user').order_by('-created_at')
