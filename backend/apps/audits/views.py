from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import AuditLog
from .serializers import AuditLogSerializer
from apps.permissions import IsAdminOrSecurityOwner


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSecurityOwner]
    filterset_fields = ['action', 'resource_type', 'is_success', 'user', 'organization']
    search_fields = ['username', 'path', 'detail', 'resource_name']
    ordering_fields = ['created_at', 'duration_ms']

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_admin:
            qs = qs.filter(organization=self.request.user.organization)
        return qs
