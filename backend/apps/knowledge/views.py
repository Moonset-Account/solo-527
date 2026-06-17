from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import KnowledgeItem, KnowledgeQuery
from .serializers import (
    KnowledgeItemSerializer, KnowledgeItemSimpleSerializer,
    KnowledgeQuerySerializer, KnowledgeReminderSerializer
)
from .services import KnowledgeItemService, KnowledgeQueryService
from apps.core.views import BaseViewSet


class KnowledgeItemViewSet(viewsets.GenericViewSet):
    queryset = KnowledgeItem.objects.select_related('created_by').all()
    serializer_class = KnowledgeItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'status', 'is_tutorial']
    search_fields = ['title', 'content', 'keywords', 'tags']
    ordering_fields = ['created_at', 'view_count', 'helpful_count', 'hit_count']

    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            queryset = queryset.filter(status=KnowledgeItem.Status.PUBLISHED)
        return queryset

    def list(self, request, *args, **kwargs):
        query = request.query_params.get('query', '')
        category = request.query_params.get('category')
        is_tutorial = request.query_params.get('is_tutorial')
        if is_tutorial is not None:
            is_tutorial = is_tutorial.lower() == 'true'

        queryset = KnowledgeItemService.search_items(
            query, category, is_tutorial, request.user
        )
        queryset = self.filter_queryset(queryset)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        KnowledgeItemService.increment_view(instance)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='hot')
    def hot(self, request):
        limit = int(request.query_params.get('limit', 10))
        items = KnowledgeItemService.get_hot_items(limit)
        serializer = KnowledgeItemSimpleSerializer(items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='reminder')
    def set_reminder(self, request, pk=None):
        item = self.get_object()
        serializer = KnowledgeReminderSerializer(data=request.data)
        if serializer.is_valid():
            query = KnowledgeItemService.set_reminder(
                item.id, serializer.validated_data['has_reminder'], request.user
            )
            if query:
                return Response({
                    'status': 'success',
                    'has_reminder': query.has_reminder,
                    'item_id': item.id
                })
            return Response(
                {'error': '未找到相关查询记录'},
                status=status.HTTP_404_NOT_FOUND
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='helpful')
    def mark_helpful(self, request, pk=None):
        item = self.get_object()
        item = KnowledgeItemService.mark_helpful(item)
        return Response({'status': 'success', 'helpful_count': item.helpful_count})

    @action(detail=True, methods=['post'], url_path='not-helpful')
    def mark_not_helpful(self, request, pk=None):
        item = self.get_object()
        item = KnowledgeItemService.mark_not_helpful(item)
        return Response({'status': 'success', 'not_helpful_count': item.not_helpful_count})


class KnowledgeQueryViewSet(viewsets.GenericViewSet):
    queryset = KnowledgeQuery.objects.select_related('user', 'matched_item').all()
    serializer_class = KnowledgeQuerySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_helpful', 'source', 'has_reminder', 'matched_item']
    search_fields = ['query_text']
    ordering_fields = ['created_at', 'match_score']

    def get_queryset(self):
        return KnowledgeQueryService.get_user_queries(self.request.user)

    def create(self, request, *args, **kwargs):
        query_text = request.data.get('query_text', '')
        source = request.data.get('source', 'api')
        matched_item_id = request.data.get('matched_item')
        match_score = request.data.get('match_score')

        matched_item = None
        if matched_item_id:
            matched_item = KnowledgeItem.objects.filter(id=matched_item_id).first()

        query = KnowledgeQueryService.create_query(
            query_text, request.user, source, matched_item, match_score
        )
        serializer = self.get_serializer(query)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):
        has_reminder = request.query_params.get('has_reminder')
        if has_reminder is not None:
            has_reminder = has_reminder.lower() == 'true'

        queryset = KnowledgeQueryService.get_user_queries(
            request.user, has_reminder
        )
        queryset = self.filter_queryset(queryset)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def hot_searches(request):
    days = int(request.query_params.get('days', 7))
    limit = int(request.query_params.get('limit', 10))
    popular = KnowledgeQueryService.get_popular_queries(days, limit)
    return Response(list(popular))
