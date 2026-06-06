from rest_framework import serializers
from .models import RepairRecord, RepairPhoto, RepairProgressLog, RepairStatus, DamageType
from apps.accounts.serializers import UserSerializer


class RepairPhotoSerializer(serializers.ModelSerializer):
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    
    class Meta:
        model = RepairPhoto
        fields = '__all__'
        read_only_fields = ['id', 'uploaded_at']


class RepairProgressLogSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = RepairProgressLog
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class RepairRecordSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    damage_type_display = serializers.CharField(source='get_damage_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    book_title = serializers.CharField(source='book_copy.book.title', read_only=True)
    book_cover = serializers.ImageField(source='book_copy.book.cover', read_only=True)
    book_copy_barcode = serializers.CharField(source='book_copy.barcode', read_only=True)
    reported_by_name = serializers.CharField(source='reported_by.username', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.username', read_only=True)
    photos = RepairPhotoSerializer(many=True, read_only=True)
    progress_logs = RepairProgressLogSerializer(many=True, read_only=True)
    
    class Meta:
        model = RepairRecord
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'reported_at']


class RepairTransitionSerializer(serializers.Serializer):
    new_status = serializers.ChoiceField(choices=RepairStatus.choices)
    notes = serializers.CharField(required=False, allow_blank=True)
    photo = serializers.ImageField(required=False)
    photo_description = serializers.CharField(required=False, allow_blank=True)


class RepairRecordCreateSerializer(serializers.Serializer):
    book_copy_id = serializers.IntegerField()
    damage_type = serializers.ChoiceField(choices=DamageType.choices)
    description = serializers.CharField()
    priority = serializers.ChoiceField(choices=['low', 'medium', 'high', 'urgent'], default='medium')
    photos = serializers.ListField(
        child=serializers.ImageField(),
        required=False
    )
