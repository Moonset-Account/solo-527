from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    ConsumableCategory, ConsumableSpecification, SpecificationAttachment, MonthlyUsage
)
from .serializers import (
    ConsumableCategorySerializer, ConsumableSpecificationSerializer,
    SpecificationAttachmentSerializer, MonthlyUsageSerializer, MonthlyUsageBatchSerializer
)
from users.permissions import IsProcurementManagerOrReadOnly


class ConsumableCategoryViewSet(viewsets.ModelViewSet):
    queryset = ConsumableCategory.objects.filter(parent__isnull=True)
    serializer_class = ConsumableCategorySerializer
    permission_classes = [IsAuthenticated, IsProcurementManagerOrReadOnly]
    search_fields = ['name', 'code']
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]

    @action(detail=False, methods=['get'])
    def all_categories(self, request):
        categories = ConsumableCategory.objects.all()
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)


class ConsumableSpecificationViewSet(viewsets.ModelViewSet):
    queryset = ConsumableSpecification.objects.select_related('category', 'created_by').prefetch_related('attachments')
    serializer_class = ConsumableSpecificationSerializer
    permission_classes = [IsAuthenticated, IsProcurementManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status', 'unit', 'brand']
    search_fields = ['name', 'specification', 'brand', 'description']
    ordering_fields = ['name', 'unit_price', 'created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post'])
    def batch_query(self, request):
        ids = request.data.get('ids', [])
        specs = self.get_queryset().filter(id__in=ids)
        serializer = self.get_serializer(specs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def batch_query_with_attachments(self, request):
        ids = request.data.get('ids', [])
        categories = request.data.get('categories', [])
        brands = request.data.get('brands', [])
        queryset = self.get_queryset()
        if ids:
            queryset = queryset.filter(id__in=ids)
        if categories:
            queryset = queryset.filter(category_id__in=categories)
        if brands:
            queryset = queryset.filter(brand__in=brands)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class SpecificationAttachmentViewSet(viewsets.ModelViewSet):
    queryset = SpecificationAttachment.objects.select_related('uploaded_by')
    serializer_class = SpecificationAttachmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['specification']

    def perform_create(self, serializer):
        file = self.request.FILES.get('file')
        file_name = file.name if file else ''
        file_type = file.content_type if file and hasattr(file, 'content_type') else ''
        file_size = file.size if file else 0
        serializer.save(
            uploaded_by=self.request.user,
            file_name=file_name,
            file_type=file_type,
            file_size=file_size
        )


class MonthlyUsageViewSet(viewsets.ModelViewSet):
    queryset = MonthlyUsage.objects.select_related('specification', 'recorded_by')
    serializer_class = MonthlyUsageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['specification', 'year', 'month', 'department']
    search_fields = ['specification__name', 'department', 'remarks']
    ordering_fields = ['year', 'month', 'quantity', 'actual_amount']

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)

    @action(detail=False, methods=['post'])
    def batch_create(self, request):
        serializer = MonthlyUsageBatchSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            usages = serializer.save()
            return Response(MonthlyUsageSerializer(usages, many=True).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        year = request.query_params.get('year')
        department = request.query_params.get('department')
        qs = self.get_queryset()
        if year:
            qs = qs.filter(year=year)
        if department:
            qs = qs.filter(department=department)
        summary = qs.values('specification__name', 'specification__specification').annotate(
            total_quantity=models.Sum('quantity'),
            total_amount=models.Sum('actual_amount')
        ).order_by('-total_amount')
        return Response(summary)
