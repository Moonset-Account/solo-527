from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from .models import (
    FollowUpPlan, RescheduleReason, Appointment,
    WaitingQueue, MedicationReminder
)
from .serializers import (
    FollowUpPlanSerializer, RescheduleReasonSerializer,
    AppointmentSerializer, AppointmentCreateSerializer,
    WaitingQueueSerializer, MedicationReminderSerializer,
    RescheduleAppointmentSerializer
)
from core.permissions import (
    IsAdminOrNurse, IsAdminOrNurseOrDoctor,
    IsDoctor, IsPatient, IsOwnerOrStaff
)
from doctors.models import DailySlot


class RescheduleReasonViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RescheduleReason.objects.filter(is_active=True)
    serializer_class = RescheduleReasonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category)
        return qs


class FollowUpPlanViewSet(viewsets.ModelViewSet):
    queryset = FollowUpPlan.objects.all()
    serializer_class = FollowUpPlanSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrNurse()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == 'PATIENT':
            return qs.filter(patient__user=user)
        if user.role == 'DOCTOR':
            return qs.filter(doctor__user=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAdminOrNurse()]
        if self.action in ['update', 'partial_update']:
            return [IsAdminOrNurseOrDoctor()]
        return [permissions.IsAuthenticated(), IsOwnerOrStaff()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == 'PATIENT':
            return qs.filter(patient__user=user)
        if user.role == 'DOCTOR':
            return qs.filter(doctor__user=user)
        status_filter = self.request.query_params.get('status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        patient = self.request.query_params.get('patient')
        doctor = self.request.query_params.get('doctor')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if date_from:
            qs = qs.filter(daily_slot__date__gte=date_from)
        if date_to:
            qs = qs.filter(daily_slot__date__lte=date_to)
        if patient:
            qs = qs.filter(patient_id=patient)
        if doctor:
            qs = qs.filter(doctor_id=doctor)
        return qs.order_by('-daily_slot__date')

    @transaction.atomic
    def perform_create(self, serializer):
        daily_slot = DailySlot.objects.get(id=self.request.data['daily_slot_id'])
        patient = serializer.validated_data['patient_id']
        from patients.models import PatientProfile
        patient_profile = PatientProfile.objects.get(id=patient)
        if patient_profile.needs_confirmation:
            pass
        appointment = serializer.save(
            patient=patient_profile,
            doctor=daily_slot.doctor,
            daily_slot=daily_slot,
            fee=daily_slot.doctor.consultation_fee,
            created_by=self.request.user
        )
        daily_slot.update_booked_count()
        from notifications.services import SMSService
        SMSService.send_confirmation(appointment)

    @action(detail=False, methods=['get'], url_path='my-appointments')
    def my_appointments(self, request):
        if request.user.role != 'PATIENT':
            return Response(status=status.HTTP_403_FORBIDDEN)
        qs = self.get_queryset().filter(patient__user=request.user)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='check-in')
    def check_in(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'NURSE']:
            return Response(status=status.HTTP_403_FORBIDDEN)
        appointment = self.get_object()
        if appointment.status != 'BOOKED':
            return Response(
                {'detail': '只有已预约状态才能签到'},
                status=status.HTTP_400_BAD_REQUEST
            )
        appointment.check_in()
        queue_count = WaitingQueue.objects.filter(
            doctor=appointment.doctor,
            queue_date=appointment.daily_slot.date
        ).count()
        WaitingQueue.objects.create(
            appointment=appointment,
            doctor=appointment.doctor,
            queue_date=appointment.daily_slot.date,
            queue_number=queue_count + 1
        )
        return Response({'status': 'success', 'message': '签到成功', 'queue_number': queue_count + 1})

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'NURSE', 'DOCTOR']:
            return Response(status=status.HTTP_403_FORBIDDEN)
        appointment = self.get_object()
        if appointment.status not in ['CHECKED_IN', 'IN_PROGRESS']:
            return Response(
                {'detail': '只有签到或就诊中状态才能完成'},
                status=status.HTTP_400_BAD_REQUEST
            )
        appointment.complete()
        appointment.daily_slot.update_booked_count()
        return Response({'status': 'success', 'message': '就诊完成'})

    @action(detail=True, methods=['post'], url_path='mark-no-show')
    def mark_no_show(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'NURSE']:
            return Response(status=status.HTTP_403_FORBIDDEN)
        appointment = self.get_object()
        if appointment.status != 'BOOKED':
            return Response(
                {'detail': '只有已预约状态才能标记爽约'},
                status=status.HTTP_400_BAD_REQUEST
            )
        patient = appointment.patient
        old_needs_confirmation = patient.needs_confirmation
        old_no_show_count = patient.no_show_count

        appointment.mark_no_show()

        patient.refresh_from_db()
        from django.conf import settings
        threshold = settings.APPOINTMENT_SETTINGS.get('NO_SHOW_THRESHOLD', 3)

        should_alert = (
            not old_needs_confirmation and
            patient.needs_confirmation and
            patient.no_show_count >= threshold
        )

        if should_alert:
            from notifications.services import SMSService
            SMSService.send_no_show_alert_to_nurse(patient)

        return Response({
            'status': 'success',
            'message': '已标记为爽约',
            'no_show_count': patient.no_show_count,
            'threshold': threshold,
            'needs_confirmation': patient.needs_confirmation,
            'alert_sent': should_alert
        })

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'NURSE']:
            return Response(status=status.HTTP_403_FORBIDDEN)
        appointment = self.get_object()
        if appointment.status != 'BOOKED':
            return Response(
                {'detail': '只有已预约状态才能取消'},
                status=status.HTTP_400_BAD_REQUEST
            )
        reason_id = request.data.get('reschedule_reason_id')
        note = request.data.get('note', '')
        reason = None
        if reason_id:
            reason = RescheduleReason.objects.filter(id=reason_id).first()
        appointment.cancel(reason=reason, note=note)
        from notifications.services import SMSService
        SMSService.send_cancellation(appointment, note)
        return Response({'status': 'success', 'message': '预约已取消'})

    @transaction.atomic
    @action(detail=True, methods=['post'], url_path='reschedule')
    def reschedule(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'NURSE']:
            return Response(status=status.HTTP_403_FORBIDDEN)
        appointment = self.get_object()
        if appointment.status != 'BOOKED':
            return Response(
                {'detail': '只有已预约状态才能改期'},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = RescheduleAppointmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_daily_slot = DailySlot.objects.get(id=serializer.validated_data['new_daily_slot_id'])
        if new_daily_slot.status != 'AVAILABLE' or new_daily_slot.available_slots <= 0:
            return Response(
                {'detail': '该号源不可预约'},
                status=status.HTTP_400_BAD_REQUEST
            )
        reason = RescheduleReason.objects.get(id=serializer.validated_data['reschedule_reason_id'])
        note = serializer.validated_data.get('reschedule_note', '')
        new_appointment = appointment.reschedule(
            new_daily_slot=new_daily_slot,
            reason=reason,
            note=note
        )
        return Response({
            'status': 'success',
            'message': '改期成功',
            'new_appointment_id': new_appointment.id,
            'new_appointment_no': new_appointment.appointment_no,
            'original_reason_preserved': True,
            'reschedule_category': reason.get_category_display()
        })

    @action(detail=True, methods=['post'], url_path='send-reminder')
    def send_reminder(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'NURSE']:
            return Response(status=status.HTTP_403_FORBIDDEN)
        appointment = self.get_object()
        if appointment.reminder_sent:
            return Response(
                {'detail': '提醒已发送过'},
                status=status.HTTP_400_BAD_REQUEST
            )
        from notifications.services import SMSService
        sms = SMSService.send_appointment_reminder(appointment)
        return Response({'status': 'success', 'message': '提醒已发送', 'sms_id': sms.id if sms else None})

    @action(detail=True, methods=['post'], url_path='patient-cancel')
    def patient_cancel(self, request, pk=None):
        appointment = self.get_object()
        if request.user.role == 'PATIENT' and appointment.patient.user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        if appointment.status != 'BOOKED':
            return Response(
                {'detail': '只有已预约状态才能取消'},
                status=status.HTTP_400_BAD_REQUEST
            )
        from .models import RescheduleReason
        reason = RescheduleReason.objects.filter(
            category='PATIENT_REQUEST',
            is_active=True
        ).first()
        note = request.data.get('note', '患者主动取消')
        appointment.cancel(reason=reason, note=note)
        from notifications.services import SMSService
        SMSService.send_cancellation(appointment, note)
        return Response({'status': 'success', 'message': '预约已取消'})

    @action(detail=True, methods=['post'], url_path='update-payment')
    def update_payment(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'NURSE']:
            return Response(status=status.HTTP_403_FORBIDDEN)
        appointment = self.get_object()
        payment_status = request.data.get('payment_status')
        if payment_status not in ['UNPAID', 'PAID', 'REFUNDED']:
            return Response(
                {'detail': '无效的缴费状态'},
                status=status.HTTP_400_BAD_REQUEST
            )
        appointment.payment_status = payment_status
        appointment.save()
        return Response({
            'status': 'success',
            'message': '缴费状态已更新',
            'payment_status': payment_status,
            'payment_status_display': appointment.get_payment_status_display()
        })


class WaitingQueueViewSet(viewsets.ModelViewSet):
    queryset = WaitingQueue.objects.all()
    serializer_class = WaitingQueueSerializer

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdminOrNurseOrDoctor()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == 'PATIENT':
            return qs.filter(appointment__patient__user=user)
        if user.role == 'DOCTOR':
            return qs.filter(doctor__user=user)
        queue_date = self.request.query_params.get('date')
        doctor = self.request.query_params.get('doctor')
        status_filter = self.request.query_params.get('status')
        if queue_date:
            qs = qs.filter(queue_date=queue_date)
        if doctor:
            qs = qs.filter(doctor_id=doctor)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.order_by('queue_date', 'queue_number')

    @action(detail=True, methods=['post'], url_path='call')
    def call_patient(self, request, pk=None):
        if request.user.role not in ['ADMIN', 'NURSE', 'DOCTOR']:
            return Response(status=status.HTTP_403_FORBIDDEN)
        queue = self.get_object()
        queue.call_patient()
        return Response({'status': 'success', 'message': '已叫号'})

    @action(detail=True, methods=['post'], url_path='start-consultation')
    def start_consultation(self, request, pk=None):
        if request.user.role not in ['DOCTOR']:
            return Response(status=status.HTTP_403_FORBIDDEN)
        queue = self.get_object()
        queue.start_consultation()
        queue.appointment.start_consultation()
        return Response({'status': 'success', 'message': '开始接诊'})

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        if request.user.role not in ['DOCTOR']:
            return Response(status=status.HTTP_403_FORBIDDEN)
        queue = self.get_object()
        queue.complete()
        queue.appointment.complete()
        return Response({'status': 'success', 'message': '接诊完成'})


class MedicationReminderViewSet(viewsets.ModelViewSet):
    queryset = MedicationReminder.objects.all()
    serializer_class = MedicationReminderSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrNurseOrDoctor()]
        return [permissions.IsAuthenticated(), IsOwnerOrStaff()]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        if user.role == 'PATIENT':
            return qs.filter(patient__user=user, is_active=True)
        patient = self.request.query_params.get('patient')
        if patient:
            qs = qs.filter(patient_id=patient)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'], url_path='my-reminders')
    def my_reminders(self, request):
        if request.user.role != 'PATIENT':
            return Response(status=status.HTTP_403_FORBIDDEN)
        qs = self.get_queryset().filter(patient__user=request.user, is_active=True)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
