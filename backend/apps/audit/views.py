from datetime import datetime

from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.models import AuditLog
from apps.audit.serializers import AuditLogDiffSerializer, AuditLogSerializer


class CanViewAudit(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['super_admin', 'host']


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('changed_by')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, CanViewAudit]
    filterset_fields = ['action', 'model_name', 'changed_by']
    search_fields = ['object_name', 'changed_by_name', 'model_name']
    ordering_fields = ['changed_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        model_name = self.request.query_params.get('model_name')
        object_id = self.request.query_params.get('object_id')
        changed_by = self.request.query_params.get('changed_by')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if model_name:
            queryset = queryset.filter(model_name__icontains=model_name)
        if object_id:
            try:
                queryset = queryset.filter(object_id=int(object_id))
            except ValueError:
                pass
        if changed_by:
            queryset = queryset.filter(changed_by_id=changed_by)
        if start_date:
            queryset = queryset.filter(changed_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(changed_at__date__lte=end_date)

        return queryset.order_by('-changed_at')

    @action(detail=True, methods=['get'])
    def diff(self, request, pk=None):
        log = self.get_object()
        diffs = log.get_field_diffs()
        serializer = AuditLogDiffSerializer(diffs, many=True)
        return Response({
            'log': AuditLogSerializer(log).data,
            'diffs': serializer.data,
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        total = AuditLog.objects.count()
        today = AuditLog.objects.filter(changed_at__date=datetime.now().date()).count()
        by_action = {
            'create': AuditLog.objects.filter(action='create').count(),
            'update': AuditLog.objects.filter(action='update').count(),
            'delete': AuditLog.objects.filter(action='delete').count(),
        }
        by_model = {}
        for log in AuditLog.objects.values_list('model_name', flat=True).distinct():
            by_model[log] = AuditLog.objects.filter(model_name=log).count()

        return Response({
            'total': total,
            'today': today,
            'by_action': by_action,
            'by_model': by_model,
        })


from datetime import datetime
