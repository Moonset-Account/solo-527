from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from datetime import datetime

from .models import Quotation, QuotationItem, QuotationExtra
from .serializers import (
    QuotationSerializer, QuotationDetailSerializer,
    QuotationItemSerializer, QuotationExtraSerializer
)
from apps.projects.models import ChangeHistory


class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['project', 'status', 'is_current']
    search_fields = ['title', 'version', 'project__name', 'project__code']
    ordering_fields = ['created_at', 'total_amount']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return QuotationDetailSerializer
        return QuotationSerializer

    def get_queryset(self):
        return super().get_queryset().annotate(
            item_count=Count('items'),
            extra_count=Count('extras'),
            extra_total=Sum('extras__amount')
        )

    def perform_create(self, serializer):
        quotation = serializer.save(created_by=self.request.user)
        quotation.calculate_total()
        quotation.save()

    def _recalculate(self, quotation):
        items = quotation.items.all()
        quotation.material_cost = sum(i.amount for i in items if i.category == 'material')
        quotation.labor_cost = sum(i.amount for i in items if i.category == 'labor')
        quotation.equipment_cost = sum(i.amount for i in items if i.category == 'equipment')
        quotation.calculate_total()
        quotation.save()

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        quotation = self.get_object()
        serializer = QuotationItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(quotation=quotation)
            self._recalculate(quotation)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def batch_add_items(self, request, pk=None):
        quotation = self.get_object()
        items_data = request.data.get('items', [])
        items = []
        for item_data in items_data:
            serializer = QuotationItemSerializer(data=item_data)
            if serializer.is_valid():
                items.append(serializer.save(quotation=quotation))
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        self._recalculate(quotation)
        return Response(QuotationItemSerializer(items, many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def add_extra(self, request, pk=None):
        quotation = self.get_object()
        serializer = QuotationExtraSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(quotation=quotation, created_by=self.request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def confirm_extra(self, request, pk=None):
        extra_id = request.data.get('extra_id')
        try:
            extra = QuotationExtra.objects.get(id=extra_id, quotation_id=pk)
        except QuotationExtra.DoesNotExist:
            return Response({'error': '增项不存在'}, status=status.HTTP_404_NOT_FOUND)
        extra.is_confirmed = True
        extra.confirmed_by = self.request.user
        extra.confirmed_at = datetime.now()
        extra.save()
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        quotation = self.get_object()
        if quotation.status != 'draft':
            return Response({'error': '只有草稿状态可以提交'}, status=status.HTTP_400_BAD_REQUEST)
        quotation.status = 'submitted'
        quotation.save()
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        quotation = self.get_object()
        if quotation.status not in ['submitted', 'draft']:
            return Response({'error': '状态无效'}, status=status.HTTP_400_BAD_REQUEST)
        quotation.status = 'confirmed'
        quotation.confirmed_by = self.request.user
        quotation.confirmed_at = datetime.now()
        quotation.save()

        ChangeHistory.objects.create(
            content_type='quotation',
            object_id=quotation.id,
            field_name='status',
            old_value='submitted',
            new_value='confirmed',
            changed_by=self.request.user,
            remark='客户已确认报价'
        )
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        quotation = self.get_object()
        quotation.status = 'rejected'
        quotation.save()
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def create_new_version(self, request, pk=None):
        old = self.get_object()
        new_version = request.data.get('version', f'v{float(old.version[1:]) + 1:.1f}')

        new_q = Quotation.objects.create(
            project=old.project,
            version=new_version,
            title=old.title,
            valid_days=old.valid_days,
            material_cost=old.material_cost,
            labor_cost=old.labor_cost,
            equipment_cost=old.equipment_cost,
            management_fee=old.management_fee,
            profit=old.profit,
            tax=old.tax,
            discount=old.discount,
            total_amount=old.total_amount,
            remark=request.data.get('remark', old.remark),
            terms=old.terms,
            created_by=self.request.user,
        )

        for item in old.items.all():
            QuotationItem.objects.create(
                quotation=new_q, category=item.category, name=item.name,
                specification=item.specification, unit=item.unit,
                quantity=item.quantity, unit_price=item.unit_price,
                amount=item.amount, remark=item.remark, sort_order=item.sort_order
            )

        old.is_current = False
        old.save()
        return Response(QuotationDetailSerializer(new_q).data, status=status.HTTP_201_CREATED)


class QuotationItemViewSet(viewsets.ModelViewSet):
    queryset = QuotationItem.objects.all()
    serializer_class = QuotationItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['quotation', 'category']


class QuotationExtraViewSet(viewsets.ModelViewSet):
    queryset = QuotationExtra.objects.all()
    serializer_class = QuotationExtraSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['quotation', 'is_confirmed']

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        extra = self.get_object()
        extra.is_confirmed = True
        extra.confirmed_by = request.user
        extra.confirmed_at = datetime.now()
        extra.save()
        return Response({'status': 'success'})
