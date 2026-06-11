from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth.models import User
from .models import Prompt, PromptCategory, PromptTemplate
from .serializers import (
    PromptListSerializer,
    PromptDetailSerializer,
    PromptCreateSerializer,
    PromptUpdateSerializer,
    PromptVersionSerializer,
    PromptCategorySerializer,
    PromptTemplateSerializer,
)


def get_operator(request):
    if request.user and request.user.is_authenticated:
        return request.user
    return User.objects.filter(is_superuser=True).first()


class PromptCategoryViewSet(viewsets.ModelViewSet):
    queryset = PromptCategory.objects.all()
    serializer_class = PromptCategorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['sort_order', 'created_at']
    ordering = ['sort_order', 'id']


class PromptTemplateViewSet(viewsets.ModelViewSet):
    queryset = PromptTemplate.objects.all()
    serializer_class = PromptTemplateSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class PromptViewSet(viewsets.ModelViewSet):
    queryset = Prompt.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category', 'is_current_version']
    search_fields = ['title', 'content', 'description']
    ordering_fields = ['created_at', 'updated_at', 'usage_count', 'accuracy_rate']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        keyword = self.request.query_params.get('keyword', None)
        version = self.request.query_params.get('version', None)
        if keyword:
            queryset = queryset.filter(
                Q(title__icontains=keyword) |
                Q(content__icontains=keyword) |
                Q(description__icontains=keyword)
            )
        if version:
            queryset = queryset.filter(version=version)
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return PromptListSerializer
        elif self.action == 'retrieve':
            return PromptDetailSerializer
        elif self.action == 'create':
            return PromptCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PromptUpdateSerializer
        return PromptDetailSerializer

    def perform_create(self, serializer):
        parent_prompt = serializer.validated_data.get('parent_prompt')
        version = '1.0'
        if parent_prompt:
            parent_version = parent_prompt.version
            try:
                major, minor = parent_version.split('.')
                version = f'{major}.{int(minor) + 1}'
            except (ValueError, AttributeError):
                version = f'{parent_version}.1'
        serializer.save(
            author=get_operator(self.request),
            version=version,
            status='draft',
            is_current_version=False
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        allowed_fields = {'gray_scale_percent', 'target_sales_operations'}
        if instance.status != 'draft':
            request_data = request.data.copy()
            non_allowed = set(request_data.keys()) - allowed_fields
            if non_allowed:
                return Response(
                    {'error': f'非草稿状态只能修改: {", ".join(allowed_fields)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            update_data = {}
            for field in allowed_fields:
                if field in request_data:
                    update_data[field] = request_data[field]
            Prompt.objects.filter(id=instance.id).update(**update_data)
            instance.refresh_from_db()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        allowed_fields = {'gray_scale_percent', 'target_sales_operations'}
        if instance.status != 'draft':
            request_data = request.data.copy()
            non_allowed = set(request_data.keys()) - allowed_fields
            if non_allowed:
                return Response(
                    {'error': f'非草稿状态只能修改: {", ".join(allowed_fields)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            update_data = {}
            for field in allowed_fields:
                if field in request_data:
                    update_data[field] = request_data[field]
            Prompt.objects.filter(id=instance.id).update(**update_data)
            instance.refresh_from_db()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        return super().partial_update(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        version_history = Prompt.objects.filter(
            Q(parent_prompt=instance) | Q(id=instance.parent_prompt_id) | Q(parent_prompt=instance.parent_prompt)
        ).order_by('-created_at')
        data['versions'] = PromptVersionSerializer(version_history, many=True).data
        return Response(data)

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        prompt = self.get_object()
        if prompt.status != 'draft':
            return Response(
                {'error': '只有草稿状态的提示词才能发布'},
                status=status.HTTP_400_BAD_REQUEST
            )
        prompt.status = 'enabled'
        prompt.is_current_version = True
        prompt.save()
        if prompt.parent_prompt:
            prompt.parent_prompt.is_current_version = False
            prompt.parent_prompt.save()
        serializer = PromptDetailSerializer(prompt)
        return Response({
            'message': '提示词已发布',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='disable')
    def disable(self, request, pk=None):
        prompt = self.get_object()
        if prompt.status != 'enabled':
            return Response(
                {'error': '只有启用状态的提示词才能停用'},
                status=status.HTTP_400_BAD_REQUEST
            )
        prompt.status = 'disabled'
        prompt.is_current_version = False
        prompt.save()
        serializer = PromptDetailSerializer(prompt)
        return Response({
            'message': '提示词已停用',
            'data': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='rollback')
    def rollback(self, request, pk=None):
        prompt = self.get_object()
        target_version_id = request.data.get('target_version_id') or request.data.get('version_id')
        if not target_version_id:
            return Response(
                {'error': '请提供 target_version_id 或 version_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            target_prompt = Prompt.objects.get(id=target_version_id)
        except Prompt.DoesNotExist:
            return Response(
                {'error': '目标版本不存在'},
                status=status.HTTP_404_NOT_FOUND
            )
        new_prompt = Prompt.objects.create(
            title=prompt.title,
            content=target_prompt.content,
            description=prompt.description,
            category=prompt.category,
            author=get_operator(request),
            status='draft',
            version=f'{prompt.version}.rollback',
            parent_prompt=prompt,
            is_current_version=False,
            gray_scale_percent=prompt.gray_scale_percent,
            target_sales_operations=prompt.target_sales_operations,
            variables=target_prompt.variables
        )
        serializer = PromptDetailSerializer(new_prompt)
        return Response({
            'message': '已创建回滚版本草稿',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='version-history')
    def version_history(self, request, pk=None):
        prompt = self.get_object()
        all_versions = Prompt.objects.filter(
            Q(id=prompt.id) |
            Q(parent_prompt=prompt) |
            Q(id=prompt.parent_prompt_id) |
            Q(parent_prompt=prompt.parent_prompt)
        ).distinct().order_by('-created_at')
        page = self.paginate_queryset(all_versions)
        if page is not None:
            serializer = PromptVersionSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = PromptVersionSerializer(all_versions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='versions')
    def versions(self, request, pk=None):
        return self.version_history(request, pk)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        total_prompts = Prompt.objects.count()
        draft_count = Prompt.objects.filter(status='draft').count()
        enabled_count = Prompt.objects.filter(status='enabled').count()
        disabled_count = Prompt.objects.filter(status='disabled').count()
        total_usage = Prompt.objects.aggregate(total=Sum('usage_count'))['total'] or 0
        avg_accuracy = Prompt.objects.filter(
            usage_count__gt=0
        ).aggregate(avg=Sum('accuracy_rate') / Sum('usage_count'))['avg'] or 0
        return Response({
            'total_prompts': total_prompts,
            'draft_count': draft_count,
            'enabled_count': enabled_count,
            'disabled_count': disabled_count,
            'total_usage': total_usage,
            'avg_accuracy': round(avg_accuracy, 4)
        })
