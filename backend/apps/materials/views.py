from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from datetime import datetime

from .models import (
    Material, MaterialUsage, MaterialPurchase, MaterialPurchaseItem,
    MaterialList, MaterialListItem
)
from .serializers import (
    MaterialSerializer, MaterialUsageSerializer, MaterialPurchaseSerializer,
    MaterialPurchaseItemSerializer, MaterialListSerializer,
    MaterialListDetailSerializer, MaterialListItemSerializer
)


class MaterialViewSet(viewsets.ModelViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['code', 'name', 'specification', 'brand']
    ordering_fields = ['code', 'name', 'unit_price', 'stock_quantity']

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        threshold = float(request.query_params.get('threshold', 10))
        materials = Material.objects.filter(stock_quantity__lte=threshold, is_active=True)
        serializer = self.get_serializer(materials, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def cost_report(self, request):
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')

        usages = MaterialUsage.objects.filter(status='approved')
        if from_date:
            usages = usages.filter(created_at__gte=from_date)
        if to_date:
            usages = usages.filter(created_at__lte=to_date)

        by_category = {}
        by_material = {}

        for usage in usages.select_related('material'):
            cat = usage.material.category
            mat_id = usage.material.id
            mat_name = usage.material.name

            by_category[cat] = by_category.get(cat, 0) + float(usage.total_amount)
            if mat_id not in by_material:
                by_material[mat_id] = {'name': mat_name, 'amount': 0, 'quantity': 0}
            by_material[mat_id]['amount'] += float(usage.total_amount)
            by_material[mat_id]['quantity'] += float(usage.quantity)

        return Response({
            'total': float(usages.aggregate(total=Sum('total_amount'))['total'] or 0),
            'by_category': by_category,
            'by_material': list(by_material.values()),
        })


class MaterialUsageViewSet(viewsets.ModelViewSet):
    queryset = MaterialUsage.objects.all()
    serializer_class = MaterialUsageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['project', 'material', 'status', 'requested_by']
    search_fields = ['purpose', 'material__name']

    def perform_create(self, serializer):
        material = serializer.validated_data['material']
        if 'unit_price' not in serializer.validated_data or not serializer.validated_data['unit_price']:
            serializer.validated_data['unit_price'] = material.unit_price
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        usage = self.get_object()
        if usage.status != 'pending':
            return Response({'error': '只有待审核状态可以批准'}, status=status.HTTP_400_BAD_REQUEST)
        usage.status = 'approved'
        usage.approved_by = request.user
        usage.approved_at = datetime.now()

        usage.material.stock_quantity -= usage.quantity
        usage.material.save()

        usage.save()
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        usage = self.get_object()
        usage.status = 'rejected'
        usage.approved_by = request.user
        usage.approved_at = datetime.now()
        usage.save()
        return Response({'status': 'success'})


class MaterialPurchaseViewSet(viewsets.ModelViewSet):
    queryset = MaterialPurchase.objects.all()
    serializer_class = MaterialPurchaseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['project', 'purchase_date']
    search_fields = ['supplier', 'invoice_no']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        purchase = self.get_object()
        serializer = MaterialPurchaseItemSerializer(data=request.data)
        if serializer.is_valid():
            item = serializer.save(purchase=purchase)
            purchase.total_amount = sum(i.total_amount for i in purchase.items.all())
            purchase.save()

            if item.material:
                item.material.stock_quantity += item.quantity
                item.material.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MaterialListViewSet(viewsets.ModelViewSet):
    queryset = MaterialList.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['project', 'is_approved']
    search_fields = ['name', 'description']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return MaterialListDetailSerializer
        return MaterialListSerializer

    def get_queryset(self):
        return super().get_queryset().annotate(item_count=Count('items'))

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        material_list = self.get_object()
        serializer = MaterialListItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(material_list=material_list)
            material_list.calculate_total()
            material_list.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def batch_add_items(self, request, pk=None):
        material_list = self.get_object()
        items_data = request.data.get('items', [])
        items = []
        for item_data in items_data:
            serializer = MaterialListItemSerializer(data=item_data)
            if serializer.is_valid():
                items.append(serializer.save(material_list=material_list))
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        material_list.calculate_total()
        material_list.save()
        return Response(MaterialListItemSerializer(items, many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        material_list = self.get_object()
        material_list.is_approved = True
        material_list.approved_by = request.user
        material_list.approved_at = datetime.now()
        material_list.save()
        return Response({'status': 'success'})


class MaterialListItemViewSet(viewsets.ModelViewSet):
    queryset = MaterialListItem.objects.all()
    serializer_class = MaterialListItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['material_list', 'material']
