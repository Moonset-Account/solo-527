from rest_framework import serializers
from .models import (
    MedicalRecordPermission, MedicalSummary,
    FollowUpRecord, Prescription, PrescriptionItem
)
from patients.serializers import PatientProfileSimpleSerializer
from doctors.serializers import DoctorProfileSimpleSerializer


class MedicalRecordPermissionSerializer(serializers.ModelSerializer):
    patient = PatientProfileSimpleSerializer(read_only=True)
    patient_id = serializers.IntegerField(write_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    permission_level_display = serializers.CharField(
        source='get_permission_level_display', read_only=True
    )

    class Meta:
        model = MedicalRecordPermission
        fields = [
            'id', 'patient', 'patient_id', 'user', 'user_name',
            'permission_level', 'permission_level_display',
            'granted_by', 'expires_at', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'granted_by']


class MedicalSummarySerializer(serializers.ModelSerializer):
    patient = PatientProfileSimpleSerializer(read_only=True)
    patient_id = serializers.IntegerField(write_only=True)
    can_view = serializers.BooleanField(read_only=True)
    can_edit = serializers.BooleanField(read_only=True)

    class Meta:
        model = MedicalSummary
        fields = [
            'id', 'patient', 'patient_id', 'chief_complaint',
            'present_illness', 'past_illness', 'family_history',
            'personal_history', 'physical_exam', 'auxiliary_exam',
            'diagnosis', 'treatment_plan', 'notes', 'created_at',
            'updated_at', 'created_by', 'last_updated_by',
            'can_view', 'can_edit'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'created_by', 'last_updated_by'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user:
            data['can_view'] = instance.can_view(request.user)
            data['can_edit'] = instance.can_edit(request.user)
        return data


class FollowUpRecordSerializer(serializers.ModelSerializer):
    patient = PatientProfileSimpleSerializer(read_only=True)
    patient_id = serializers.IntegerField(write_only=True)
    doctor = DoctorProfileSimpleSerializer(read_only=True)
    doctor_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = FollowUpRecord
        fields = [
            'id', 'followup_plan', 'appointment', 'patient', 'patient_id',
            'doctor', 'doctor_id', 'visit_number', 'visit_date',
            'symptoms', 'physical_exam', 'blood_pressure', 'heart_rate',
            'blood_sugar', 'weight', 'exam_results', 'diagnosis',
            'medication_adjustment', 'lifestyle_advice', 'next_visit_date',
            'notes', 'created_at', 'updated_at', 'created_by'
        ]
        read_only_fields = [
            'id', 'visit_number', 'created_at', 'updated_at', 'created_by'
        ]


class PrescriptionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrescriptionItem
        fields = [
            'id', 'medication_name', 'specification', 'quantity',
            'unit', 'dosage', 'frequency', 'duration', 'notes', 'sort_order'
        ]
        read_only_fields = ['id']


class PrescriptionSerializer(serializers.ModelSerializer):
    patient = PatientProfileSimpleSerializer(read_only=True)
    patient_id = serializers.IntegerField(write_only=True)
    doctor = DoctorProfileSimpleSerializer(read_only=True)
    doctor_id = serializers.IntegerField(write_only=True)
    items = PrescriptionItemSerializer(many=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Prescription
        fields = [
            'id', 'prescription_no', 'appointment', 'patient', 'patient_id',
            'doctor', 'doctor_id', 'status', 'status_display', 'notes',
            'items', 'created_at', 'created_by'
        ]
        read_only_fields = [
            'id', 'prescription_no', 'created_at', 'created_by'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        prescription = Prescription.objects.create(**validated_data)
        for item_data in items_data:
            PrescriptionItem.objects.create(prescription=prescription, **item_data)
        return prescription

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                PrescriptionItem.objects.create(prescription=instance, **item_data)
        return instance
