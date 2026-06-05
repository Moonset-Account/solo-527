from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import PatientProfile, ChronicDisease
from .serializers import (
    PatientProfileSerializer, PatientProfileCreateSerializer,
    PatientProfileUpdateSerializer, ChronicDiseaseSerializer,
    PatientProfileSimpleSerializer
)
from core.permissions import IsAdminOrNurse, IsAdminOrNurseOrDoctor, IsOwnerOrStaff


class ChronicDiseaseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ChronicDisease.objects.filter(is_active=True)
    serializer_class = ChronicDiseaseSerializer
    permission_classes = [permissions.IsAuthenticated]


class PatientProfileViewSet(viewsets.ModelViewSet):
    queryset = PatientProfile.objects.all()
    serializer_class = PatientProfileSerializer

    def get_permissions(self):
        if self.action in ['list', 'create']:
            return [IsAdminOrNurse()]
        if self.action in ['update', 'partial_update']:
            return [IsAdminOrNurseOrDoctor()]
        return [permissions.IsAuthenticated(), IsOwnerOrStaff()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == 'PATIENT':
            return qs.filter(user=user)
        if user.role == 'DOCTOR':
            return qs.filter(appointments__doctor__user=user).distinct()
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return PatientProfileCreateSerializer
        if self.action in ['update', 'partial_update']:
            if self.request.user.role == 'PATIENT':
                return PatientProfileUpdateSerializer
        if self.action == 'list' and self.request.user.role in ['DOCTOR', 'NURSE']:
            return PatientProfileSimpleSerializer
        return PatientProfileSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['created_by'] = self.request.user
        return context

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get'], url_path='me')
    def get_my_profile(self, request):
        try:
            profile = PatientProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except PatientProfile.DoesNotExist:
            return Response(
                {'detail': '患者档案不存在'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'], url_path='reset-no-show')
    def reset_no_show(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'NURSE']:
            return Response(status=status.HTTP_403_FORBIDDEN)
        patient = self.get_object()
        patient.reset_no_show()
        return Response({'status': 'success', 'message': '已重置爽约次数'})
