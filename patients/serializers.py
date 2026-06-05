from rest_framework import serializers
from django.db import transaction
from .models import PatientProfile, ChronicDisease
from core.models import User
from core.serializers import UserSerializer


class ChronicDiseaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChronicDisease
        fields = '__all__'


class PatientProfileCreateSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True, required=False, help_text='已有用户ID，可选')
    create_user = serializers.BooleanField(write_only=True, required=False, default=False, help_text='是否自动创建用户账号')
    username = serializers.CharField(write_only=True, required=False, help_text='新建用户的用户名')
    password = serializers.CharField(write_only=True, required=False, help_text='新建用户的密码')
    chronic_disease_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        help_text='慢病ID列表'
    )

    class Meta:
        model = PatientProfile
        fields = [
            'name', 'gender', 'birth_date', 'id_card', 'phone',
            'emergency_contact', 'emergency_phone', 'address',
            'marital_status', 'allergies', 'medical_history',
            'height', 'weight', 'blood_type',
            'user_id', 'create_user', 'username', 'password',
            'chronic_disease_ids'
        ]

    @transaction.atomic
    def create(self, validated_data):
        user_id = validated_data.pop('user_id', None)
        create_user = validated_data.pop('create_user', False)
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)
        chronic_disease_ids = validated_data.pop('chronic_disease_ids', [])

        user = None
        if user_id:
            user = User.objects.filter(id=user_id, role='PATIENT').first()
        elif create_user and username and password:
            user = User.objects.create_user(
                username=username,
                password=password,
                role='PATIENT',
                phone=validated_data.get('phone')
            )

        if not user:
            raise serializers.ValidationError({
                'user': '必须提供user_id或设置create_user=True并提供username和password'
            })

        from datetime import datetime
        today = datetime.now().strftime('%Y%m%d')
        count = PatientProfile.objects.filter(
            created_at__date=datetime.now().date()
        ).count() + 1
        patient_no = f'P{today}{count:04d}'

        created_by = self.context.get('created_by')
        patient = PatientProfile.objects.create(
            user=user,
            patient_no=patient_no,
            created_by=created_by,
            **validated_data
        )

        if chronic_disease_ids:
            patient.chronic_diseases.set(chronic_disease_ids)

        return patient


class PatientProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientProfile
        fields = [
            'phone', 'emergency_contact', 'emergency_phone',
            'address', 'allergies'
        ]


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
