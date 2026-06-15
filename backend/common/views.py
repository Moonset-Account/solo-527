from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import OperationLog, SystemConfig, PublicSeaRule
from .serializers import OperationLogSerializer, SystemConfigSerializer, PublicSeaRuleSerializer
from django.contrib.contenttypes.models import ContentType


class OperationLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = OperationLog.objects.all()
    serializer_class = OperationLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['action', 'user', 'content_type']
    search_fields = ['description', 'user__username']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'], url_path='by-object')
    def by_object(self, request):
        content_type = request.query_params.get('content_type')
        object_id = request.query_params.get('object_id')
        if content_type and object_id:
            ct = ContentType.objects.get(model=content_type)
            logs = OperationLog.objects.filter(content_type=ct, object_id=object_id)
            serializer = self.get_serializer(logs, many=True)
            return Response(serializer.data)
        return Response([])


class SystemConfigViewSet(viewsets.ModelViewSet):
    queryset = SystemConfig.objects.all()
    serializer_class = SystemConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='by-key/(?P<key>[^/.]+)')
    def by_key(self, request, key=None):
        try:
            config = SystemConfig.objects.get(key=key)
            return Response(SystemConfigSerializer(config).data)
        except SystemConfig.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)


class PublicSeaRuleViewSet(viewsets.ModelViewSet):
    queryset = PublicSeaRule.objects.all()
    serializer_class = PublicSeaRuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='active')
    def active_rule(self, request):
        rule = PublicSeaRule.objects.filter(is_active=True).first()
        if rule:
            return Response(PublicSeaRuleSerializer(rule).data)
        return Response({'detail': 'No active rule'}, status=404)
