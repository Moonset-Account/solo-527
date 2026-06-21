from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from .models import Supplier, SupplierRisk, SupplierRiskEvidence, SupplierEvaluation
from .serializers import (
    SupplierSerializer, SupplierRiskSerializer, SupplierRiskEvidenceSerializer, SupplierEvaluationSerializer
)
from users.permissions import IsProcurementManagerOrReadOnly


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.select_related('created_by').prefetch_related('risks')
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated, IsProcurementManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'credit_rating']
    search_fields = ['name', 'unified_social_credit_code', 'contact_person', 'contact_phone']
    ordering_fields = ['name', 'created_at', 'registered_capital']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def risk_summary(self, request):
        suppliers = Supplier.objects.all()
        total = suppliers.count()
        by_status = suppliers.values('status').annotate(count=models.Count('id'))
        by_risk = [
            {'level': 'critical', 'count': suppliers.annotate(
                critical_risks=models.Count(models.Case(
                    models.When(risks__risk_level='critical', risks__status__in=['open', 'monitoring'], then=1),
                    output_field=models.IntegerField()
                ))
            ).filter(critical_risks__gt=0).count()},
            {'level': 'high', 'count': suppliers.annotate(
                high_risks=models.Count(models.Case(
                    models.When(risks__risk_level='high', risks__status__in=['open', 'monitoring'], then=1),
                    output_field=models.IntegerField()
                ))
            ).filter(high_risks__gt=0).count()},
            {'level': 'medium', 'count': suppliers.annotate(
                medium_risks=models.Count(models.Case(
                    models.When(risks__risk_level='medium', risks__status__in=['open', 'monitoring'], then=1),
                    output_field=models.IntegerField()
                ))
            ).filter(medium_risks__gt=0).count()},
            {'level': 'low', 'count': suppliers.annotate(
                low_risks=models.Count(models.Case(
                    models.When(risks__risk_level='low', risks__status__in=['open', 'monitoring'], then=1),
                    output_field=models.IntegerField()
                ))
            ).filter(low_risks__gt=0).count()},
        ]
        return Response({
            'total': total,
            'by_status': list(by_status),
            'by_risk': by_risk
        })


class SupplierRiskViewSet(viewsets.ModelViewSet):
    queryset = SupplierRisk.objects.select_related('supplier', 'identified_by', 'assigned_to').prefetch_related('evidences')
    serializer_class = SupplierRiskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['supplier', 'risk_type', 'risk_level', 'status', 'assigned_to']
    search_fields = ['title', 'description', 'supplier__name']
    ordering_fields = ['risk_level', 'discovered_date', 'created_at', 'status']

    def perform_create(self, serializer):
        serializer.save(identified_by=self.request.user)

    @action(detail=True, methods=['post'])
    def handle(self, request, pk=None):
        risk = self.get_object()
        action = request.data.get('action')
        mitigation = request.data.get('mitigation_measures', '')
        status_val = request.data.get('status')
        if mitigation:
            risk.mitigation_measures = mitigation
        if status_val:
            risk.status = status_val
            if status_val in ['resolved', 'closed']:
                from datetime import date
                risk.actual_resolution_date = date.today()
        if action == 'assign':
            assigned_to_id = request.data.get('assigned_to')
            if assigned_to_id:
                from users.models import User
                risk.assigned_to = User.objects.get(id=assigned_to_id)
                risk.status = 'monitoring'
        risk.save()
        return Response(self.get_serializer(risk).data)


class SupplierRiskEvidenceViewSet(viewsets.ModelViewSet):
    queryset = SupplierRiskEvidence.objects.select_related('risk', 'uploaded_by')
    serializer_class = SupplierRiskEvidenceSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['risk']

    def perform_create(self, serializer):
        file = self.request.FILES.get('file')
        file_name = file.name if file else ''
        serializer.save(
            uploaded_by=self.request.user,
            file_name=file_name
        )


class SupplierEvaluationViewSet(viewsets.ModelViewSet):
    queryset = SupplierEvaluation.objects.select_related('supplier', 'evaluated_by')
    serializer_class = SupplierEvaluationSerializer
    permission_classes = [IsAuthenticated, IsProcurementManagerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['supplier', 'evaluation_period']
    ordering_fields = ['overall_score', 'evaluation_date']

    def perform_create(self, serializer):
        data = self.request.data
        overall = (
            float(data.get('quality_score', 0)) +
            float(data.get('delivery_score', 0)) +
            float(data.get('price_score', 0)) +
            float(data.get('service_score', 0))
        ) / 4
        serializer.save(evaluated_by=self.request.user, overall_score=overall)
