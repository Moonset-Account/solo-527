from rest_framework import serializers
from .models import DoctorProfile, DoctorSchedule, DailySlot
from core.serializers import DepartmentSerializer


class DoctorProfileSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    department_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = DoctorProfile
        fields = [
            'id', 'employee_no', 'name', 'title', 'department',
            'department_id', 'specialties', 'consultation_fee',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class DoctorProfileSimpleSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = DoctorProfile
        fields = ['id', 'name', 'title', 'department_name', 'consultation_fee']
        read_only_fields = fields


class DoctorScheduleSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)

    class Meta:
        model = DoctorSchedule
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class DailySlotSerializer(serializers.ModelSerializer):
    doctor = DoctorProfileSimpleSerializer(read_only=True)
    doctor_id = serializers.IntegerField(write_only=True, required=False)
    available_slots = serializers.IntegerField(read_only=True)
    shift_display = serializers.CharField(source='get_shift_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = DailySlot
        fields = [
            'id', 'doctor', 'doctor_id', 'date', 'shift', 'shift_display',
            'max_patients', 'booked_count', 'available_slots', 'status',
            'status_display', 'cancel_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'booked_count', 'created_at', 'updated_at']
