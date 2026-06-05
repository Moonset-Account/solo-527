from rest_framework import serializers
from .models import (
    FollowUpPlan, RescheduleReason, Appointment,
    WaitingQueue, MedicationReminder
)
from patients.serializers import PatientProfileSimpleSerializer
from doctors.serializers import DoctorProfileSimpleSerializer, DailySlotSerializer


class RescheduleReasonSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = RescheduleReason
        fields = ['id', 'category', 'category_display', 'name', 'description', 'is_active']
        read_only_fields = ['id']


class FollowUpPlanSerializer(serializers.ModelSerializer):
    patient = PatientProfileSimpleSerializer(read_only=True)
    patient_id = serializers.IntegerField(write_only=True)
    doctor = DoctorProfileSimpleSerializer(read_only=True)
    doctor_id = serializers.IntegerField(write_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = FollowUpPlan
        fields = [
            'id', 'patient', 'patient_id', 'doctor', 'doctor_id',
            'title', 'description', 'total_visits', 'interval_days',
            'start_date', 'next_appointment_date', 'status',
            'status_display', 'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']


class FollowUpPlanSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = FollowUpPlan
        fields = ['id', 'title', 'total_visits', 'status']


class AppointmentSerializer(serializers.ModelSerializer):
    patient = PatientProfileSimpleSerializer(read_only=True)
    patient_id = serializers.IntegerField(write_only=True, required=False)
    doctor = DoctorProfileSimpleSerializer(read_only=True)
    doctor_id = serializers.IntegerField(write_only=True, required=False)
    daily_slot = DailySlotSerializer(read_only=True)
    daily_slot_id = serializers.IntegerField(write_only=True)
    followup_plan = FollowUpPlanSimpleSerializer(read_only=True)
    followup_plan_id = serializers.IntegerField(write_only=True, required=False)
    reschedule_reason = RescheduleReasonSerializer(read_only=True)
    reschedule_reason_id = serializers.IntegerField(write_only=True, required=False)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    date = serializers.DateField(source='daily_slot.date', read_only=True)
    shift = serializers.CharField(source='daily_slot.shift', read_only=True)
    shift_display = serializers.CharField(source='daily_slot.get_shift_display', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'appointment_no', 'patient', 'patient_id',
            'doctor', 'doctor_id', 'daily_slot', 'daily_slot_id',
            'followup_plan', 'followup_plan_id',
            'queue_number', 'reason', 'original_reason',
            'status', 'status_display',
            'payment_status', 'payment_status_display',
            'fee', 'reschedule_reason', 'reschedule_reason_id',
            'reschedule_note', 'date', 'shift', 'shift_display',
            'checked_in_at', 'completed_at', 'cancelled_at',
            'reminder_sent', 'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = [
            'id', 'appointment_no', 'created_at', 'updated_at',
            'created_by', 'original_reason', 'queue_number'
        ]


class AppointmentCreateSerializer(serializers.ModelSerializer):
    daily_slot_id = serializers.IntegerField(write_only=True)
    patient_id = serializers.IntegerField(write_only=True)
    followup_plan_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Appointment
        fields = [
            'patient_id', 'daily_slot_id', 'followup_plan_id',
            'reason', 'fee'
        ]


class WaitingQueueSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='appointment.patient.name', read_only=True)
    appointment_no = serializers.CharField(source='appointment.appointment_no', read_only=True)
    doctor = DoctorProfileSimpleSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = WaitingQueue
        fields = [
            'id', 'appointment', 'appointment_no', 'patient_name',
            'doctor', 'queue_date', 'queue_number', 'status',
            'status_display', 'called_at', 'completed_at',
            'estimated_wait_time', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MedicationReminderSerializer(serializers.ModelSerializer):
    patient = PatientProfileSimpleSerializer(read_only=True)
    patient_id = serializers.IntegerField(write_only=True, required=False)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)

    class Meta:
        model = MedicationReminder
        fields = [
            'id', 'patient', 'patient_id', 'medication_name',
            'dosage', 'frequency', 'frequency_display',
            'start_date', 'end_date', 'notes', 'is_active',
            'created_at', 'created_by'
        ]
        read_only_fields = ['id', 'created_at', 'created_by']


class RescheduleAppointmentSerializer(serializers.Serializer):
    new_daily_slot_id = serializers.IntegerField()
    reschedule_reason_id = serializers.IntegerField()
    reschedule_note = serializers.CharField(required=False, allow_blank=True)

    def validate_reschedule_reason_id(self, value):
        try:
            reason = RescheduleReason.objects.get(id=value)
            if reason.category not in ['DOCTOR_ABSENT', 'PATIENT_REQUEST', 'MEDICINE_SHORTAGE', 'OTHER']:
                raise serializers.ValidationError('无效的改期原因分类')
            return value
        except RescheduleReason.DoesNotExist:
            raise serializers.ValidationError('改期原因不存在')
