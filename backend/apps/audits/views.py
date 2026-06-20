from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import AuditLog
from .serializers import AuditLogSerializer
from apps.permissions import IsAdminOrSecurityOwner


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated, IsAdminOrSecurityOwner]
    filterset_fields = ['action', 'resource_type', 'is_success', 'user', 'organization', 'method', 'status_code']
    search_fields = ['username', 'path', 'detail', 'resource_name', 'ip_address']
    ordering_fields = ['created_at', 'duration_ms']

    def get_queryset(self):
        qs = super().get_queryset()
        qs = qs.filter(organization=self.request.user.organization)
        status = self.request.query_params.get('status')
        if status == 'success':
            qs = qs.filter(status_code__gte=200, status_code__lt=400)
        elif status == 'error':
            qs = qs.filter(status_code__gte=400)
        created_from = self.request.query_params.get('created_from')
        created_to = self.request.query_params.get('created_to')
        if created_from:
            qs = qs.filter(created_at__gte=created_from)
        if created_to:
            qs = qs.filter(created_at__lte=created_to)
        return qs
