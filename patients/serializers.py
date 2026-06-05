from rest_framework import serializers
from .models import PatientProfile, ChronicDisease
from core.serializers import UserSerializer


class ChronicDiseaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChronicDisease
        fields = '__all__'


class PatientProfileSerializer(serializers.ModelSerializer):
    chronic_diseases = ChronicDiseaseSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    age = serializers.IntegerField(read_only=True)

    class Meta:
        model = PatientProfile
        fields = [
            'id', 'patient_no', 'name', 'gender', 'birth_date', 'age',
            'id_card', 'phone', 'emergency_contact', 'emergency_phone',
            'address', 'marital_status', 'chronic_diseases', 'allergies',
            'medical_history', 'height', 'weight', 'blood_type',
            'is_active', 'no_show_count', 'needs_confirmation',
            'created_at', 'updated_at', 'user'
        ]
        read_only_fields = [
            'id', 'patient_no', 'created_at', 'updated_at',
            'no_show_count', 'needs_confirmation', 'user'
        ]


class PatientProfileSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = ['id', 'patient_no', 'name', 'gender', 'age', 'phone', 'needs_confirmation']
        read_only_fields = fields
