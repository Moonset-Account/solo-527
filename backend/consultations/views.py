from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import ConsultationRecord, ConsultationAttachment, TreatmentItem, ConsultationTreatmentItem
from .serializers import (
    ConsultationRecordSerializer, ConsultationRecordListSerializer,
    ConsultationAttachmentSerializer, TreatmentItemSerializer,
    ConsultationTreatmentItemSerializer
)
from .filters import ConsultationFilter
from django.db.models import Sum


class TreatmentItemViewSet(viewsets.ModelViewSet):
    queryset = TreatmentItem.objects.all()
    serializer_class = TreatmentItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'category']


class ConsultationRecordViewSet(viewsets.ModelViewSet):
    queryset = ConsultationRecord.objects.select_related('customer', 'lead', 'consultation_doctor', 'consultant', 'created_by').all()
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = ConsultationFilter
    search_fields = ['customer__name', 'chief_complaint', 'diagnosis']
    ordering_fields = ['created_at', 'estimated_price']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ConsultationRecordListSerializer
        return ConsultationRecordSerializer

    @action(detail=True, methods=['post'], url_path='add-treatment-item')
    def add_treatment_item(self, request, pk=None):
        consultation = self.get_object()
        treatment_item_id = request.data.get('treatment_item_id')
        quantity = request.data.get('quantity', 1)
        discount = request.data.get('discount', 0)
        notes = request.data.get('notes', '')

        try:
            treatment_item = TreatmentItem.objects.get(id=treatment_item_id)
            item = ConsultationTreatmentItem.objects.create(
                consultation=consultation,
                treatment_item=treatment_item,
                quantity=quantity,
                unit_price=treatment_item.price,
                discount=discount,
                notes=notes
            )
            return Response(ConsultationTreatmentItemSerializer(item).data)
        except TreatmentItem.DoesNotExist:
            return Response({'detail': '治疗项目不存在'}, status=400)

    @action(detail=True, methods=['post'], url_path='remove-treatment-item/(?P<item_id>[^/.]+)')
    def remove_treatment_item(self, request, pk=None, item_id=None):
        consultation = self.get_object()
        try:
            item = consultation.treatment_items.get(id=item_id)
            item.delete()
            return Response({'status': 'success'})
        except ConsultationTreatmentItem.DoesNotExist:
            return Response({'detail': '项目不存在'}, status=404)

    @action(detail=False, methods=['get'], url_path='my-consultations')
    def my_consultations(self, request):
        consultations = self.filter_queryset(self.get_queryset()).filter(
            consultation_doctor=request.user
        ) | self.filter_queryset(self.get_queryset()).filter(
            consultant=request.user
        )
        consultations = consultations.distinct()
        page = self.paginate_queryset(consultations)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(consultations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='total')
    def get_total(self, request, pk=None):
        consultation = self.get_object()
        total = consultation.treatment_items.aggregate(
            total=Sum('subtotal')
        )['total'] or 0
        return Response({'total_amount': total})


class ConsultationAttachmentViewSet(viewsets.ModelViewSet):
    queryset = ConsultationAttachment.objects.all()
    serializer_class = ConsultationAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['consultation']

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
