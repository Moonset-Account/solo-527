from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from .models import DictionaryCategory, DictionaryItem
from .serializers import (
    DictionaryCategorySerializer, DictionaryCategoryDetailSerializer,
    DictionaryItemSerializer, DictionaryItemSimpleSerializer
)
from apps.viewsets import OrganizationScopedViewSet


class DictionaryCategoryViewSet(OrganizationScopedViewSet):
    queryset = DictionaryCategory.objects.all()
    filterset_fields = ['code']
    search_fields = ['name', 'code']
    ordering_fields = ['code', 'name', 'created_at']

    def get_queryset(self):
        qs = super().get_queryset().annotate(item_count=Count('items'))
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


class DictionaryItemViewSet(OrganizationScopedViewSet):
    queryset = DictionaryItem.objects.all()
    serializer_class = DictionaryItemSerializer
    filterset_fields = ['category', 'is_active', 'is_default']
    search_fields = ['name', 'code', 'value']
    ordering_fields = ['code', 'name', 'sort_order', 'created_at']
