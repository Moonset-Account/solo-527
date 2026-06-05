from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    MedicalRecordPermission, MedicalSummary,
    FollowUpRecord, Prescription
)
from .serializers import (
    MedicalRecordPermissionSerializer, MedicalSummarySerializer,
    FollowUpRecordSerializer, PrescriptionSerializer
)
from core.permissions import IsAdminOrNurseOrDoctor, IsOwnerOrStaff


class MedicalRecordPermissionViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecordPermission.objects.all()
    serializer_class = MedicalRecordPermissionSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrNurseOrDoctor()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset().filter(is_active=True)
        if user.role == 'PATIENT':
            return qs.filter(patient__user=user)
        patient = self.request.query_params.get('patient')
        if patient:
            qs = qs.filter(patient_id=patient)
        return qs

    def perform_create(self, serializer):
        serializer.save(granted_by=self.request.user)


class MedicalSummaryViewSet(viewsets.ModelViewSet):
    queryset = MedicalSummary.objects.all()
    serializer_class = MedicalSummarySerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrNurseOrDoctor()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == 'PATIENT':
            return qs.filter(patient__user=user)
        if user.role == 'DOCTOR':
            patient_ids = MedicalRecordPermission.objects.filter(
                user=user, is_active=True, permission_level__in=['READ', 'WRITE', 'FULL']
            ).values_list('patient_id', flat=True)
            return qs.filter(patient_id__in=patient_ids)
        patient = self.request.query_params.get('patient')
        if patient:
            qs = qs.filter(patient_id=patient)
        return qs

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.can_view(request.user):
            return Response(
                {'detail': '您没有查看该病历的权限'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance.can_edit(request.user):
            return Response(
                {'detail': '您没有编辑该病历的权限'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            last_updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(last_updated_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='my-summary')
    def my_summary(self, request):
        if request.user.role != 'PATIENT':
            return Response(status=status.HTTP_403_FORBIDDEN)
        try:
            summary = MedicalSummary.objects.get(patient__user=request.user)
            serializer = self.get_serializer(summary)
            return Response(serializer.data)
        except MedicalSummary.DoesNotExist:
            return Response(
                {'detail': '病历摘要不存在'},
                status=status.HTTP_404_NOT_FOUND
            )


class FollowUpRecordViewSet(viewsets.ModelViewSet):
    queryset = FollowUpRecord.objects.all()
    serializer_class = FollowUpRecordSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrNurseOrDoctor()]
        return [permissions.IsAuthenticated(), IsOwnerOrStaff()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == 'PATIENT':
            return qs.filter(patient__user=user)
        if user.role == 'DOCTOR':
            return qs.filter(doctor__user=user)
        patient = self.request.query_params.get('patient')
        followup_plan = self.request.query_params.get('followup_plan')
        if patient:
            qs = qs.filter(patient_id=patient)
        if followup_plan:
            qs = qs.filter(followup_plan_id=followup_plan)
        return qs.order_by('-visit_date')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='my-records')
    def my_records(self, request):
        if request.user.role != 'PATIENT':
            return Response(status=status.HTTP_403_FORBIDDEN)
        qs = self.get_queryset().filter(patient__user=request.user)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrNurseOrDoctor()]
        return [permissions.IsAuthenticated(), IsOwnerOrStaff()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == 'PATIENT':
            return qs.filter(patient__user=user)
        if user.role == 'DOCTOR':
            return qs.filter(doctor__user=user)
        patient = self.request.query_params.get('patient')
        appointment = self.request.query_params.get('appointment')
        if patient:
            qs = qs.filter(patient_id=patient)
        if appointment:
            qs = qs.filter(appointment_id=appointment)
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='my-prescriptions')
    def my_prescriptions(self, request):
        if request.user.role != 'PATIENT':
            return Response(status=status.HTTP_403_FORBIDDEN)
        qs = self.get_queryset().filter(patient__user=request.user)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
