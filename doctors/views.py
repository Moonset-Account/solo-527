from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import models as django_models
from datetime import timedelta
from .models import DoctorProfile, DoctorSchedule, DailySlot
from .serializers import (
    DoctorProfileSerializer, DoctorProfileSimpleSerializer,
    DoctorScheduleSerializer, DailySlotSerializer
)
from core.permissions import IsAdminOrNurse, IsAdminOrNurseOrDoctor, IsDoctor


class DoctorProfileViewSet(viewsets.ModelViewSet):
    queryset = DoctorProfile.objects.all()
    serializer_class = DoctorProfileSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrNurse()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset().filter(is_active=True)
        department = self.request.query_params.get('department')
        if department:
            qs = qs.filter(department_id=department)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return DoctorProfileSimpleSerializer
        return DoctorProfileSerializer

    @action(detail=False, methods=['get'], url_path='me')
    def get_my_profile(self, request):
        try:
            profile = DoctorProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except DoctorProfile.DoesNotExist:
            return Response(
                {'detail': '医生档案不存在'},
                status=status.HTTP_404_NOT_FOUND
            )


class DoctorScheduleViewSet(viewsets.ModelViewSet):
    queryset = DoctorSchedule.objects.all()
    serializer_class = DoctorScheduleSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrNurse()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset().filter(is_active=True)
        doctor = self.request.query_params.get('doctor')
        if doctor:
            qs = qs.filter(doctor_id=doctor)
        return qs


class DailySlotViewSet(viewsets.ModelViewSet):
    queryset = DailySlot.objects.all()
    serializer_class = DailySlotSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrNurseOrDoctor()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        today = timezone.now().date()

        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        doctor = self.request.query_params.get('doctor')
        department = self.request.query_params.get('department')
        only_available = self.request.query_params.get('only_available')

        if date_from:
            qs = qs.filter(date__gte=date_from)
        else:
            qs = qs.filter(date__gte=today)

        if date_to:
            qs = qs.filter(date__lte=date_to)

        if doctor:
            qs = qs.filter(doctor_id=doctor)

        if department:
            qs = qs.filter(doctor__department_id=department)

        if only_available == 'true':
            qs = qs.filter(
                status='AVAILABLE',
                booked_count__lt=django_models.F('max_patients')
            )

        return qs.order_by('date', 'shift')

    @action(detail=False, methods=['post'], url_path='generate-from-schedule')
    def generate_from_schedule(self, request):
        if request.user.role not in ['ADMIN', 'NURSE']:
            return Response(status=status.HTTP_403_FORBIDDEN)

        weeks = int(request.data.get('weeks', 4))
        today = timezone.now().date()
        created_count = 0

        from django.db import models as django_models
        for schedule in DoctorSchedule.objects.filter(is_active=True):
            for week_offset in range(weeks):
                days_ahead = schedule.day_of_week - today.weekday()
                if days_ahead < 0:
                    days_ahead += 7
                days_ahead += week_offset * 7
                slot_date = today + timedelta(days=days_ahead)

                _, created = DailySlot.objects.get_or_create(
                    doctor=schedule.doctor,
                    date=slot_date,
                    shift=schedule.shift,
                    defaults={
                        'max_patients': schedule.max_patients,
                        'status': 'AVAILABLE'
                    }
                )
                if created:
                    created_count += 1

        return Response({
            'status': 'success',
            'message': f'已生成 {created_count} 个号源'
        })

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel_slot(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'NURSE', 'DOCTOR']:
            return Response(status=status.HTTP_403_FORBIDDEN)

        slot = self.get_object()
        slot.status = 'CANCELLED'
        slot.cancel_reason = request.data.get('reason', '')
        slot.save()

        from appointments.models import Appointment
        appointments = Appointment.objects.filter(
            daily_slot=slot,
            status='BOOKED'
        )
        for apt in appointments:
            apt.cancel(
                reason=request.data.get('reschedule_reason_id'),
                note=slot.cancel_reason
            )

        return Response({
            'status': 'success',
            'message': f'号源已停诊，已取消 {appointments.count()} 个预约'
        })
