from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from .models import DictionaryCategory, DictionaryItem
from .serializers import (
    DictionaryCategorySerializer, DictionaryCategoryDetailSerializer,
    DictionaryItemSerializer, DictionaryItemSimpleSerializer
)
from apps.viewsets import OrganizationScopedViewSet
from apps.permissions import IsAdmin


class DictionaryCategoryViewSet(OrganizationScopedViewSet):
    queryset = DictionaryCategory.objects.all()
    filterset_fields = ['code', 'is_active', 'is_enabled']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['code', 'name', 'created_at']
    action_permission_classes = {
        'create': [IsAuthenticated, IsAdmin],
        'update': [IsAuthenticated, IsAdmin],
        'partial_update': [IsAuthenticated, IsAdmin],
        'destroy': [IsAuthenticated, IsAdmin],
    }

    def get_queryset(self):
        qs = super().get_queryset().annotate(item_count=Count('items'), items_count=Count('items'))
        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DictionaryCategoryDetailSerializer
        return DictionaryCategorySerializer

    @action(detail=False, methods=['get'], url_path='by-code/(?P<code>[^/.]+)')
    def by_code(self, request, code=None):
        qs = self.get_queryset().filter(code=code).first()
        if not qs:
            return Response([])
        items = DictionaryItem.objects.filter(
            category=qs,
            organization=request.user.organization,
            is_active=True
        ).order_by('sort_order', 'code')
        serializer = DictionaryItemSimpleSerializer(items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        category = self.get_object()
        qs = DictionaryItem.objects.filter(
            category=category,
            organization=request.user.organization
        ).order_by('sort_order', 'code')
        is_active = request.query_params.get('is_active')
        is_enabled = request.query_params.get('is_enabled')
        if is_active != '' and is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        if is_enabled != '' and is_enabled is not None:
            qs = qs.filter(is_enabled=is_enabled.lower() == 'true')
        serializer = DictionaryItemSerializer(qs, many=True)
        return Response(serializer.data)


class DictionaryItemViewSet(OrganizationScopedViewSet):
    queryset = DictionaryItem.objects.all()
    serializer_class = DictionaryItemSerializer
    filterset_fields = ['category', 'is_active', 'is_default']
    search_fields = ['name', 'code', 'value']
    ordering_fields = ['code', 'name', 'sort_order', 'created_at']
    action_permission_classes = {
        'create': [IsAuthenticated, IsAdmin],
        'update': [IsAuthenticated, IsAdmin],
        'partial_update': [IsAuthenticated, IsAdmin],
        'destroy': [IsAuthenticated, IsAdmin],
    }
