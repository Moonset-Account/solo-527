from rest_framework import serializers
from .models import DailyRecord, GrowthPhoto


class GrowthPhotoSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True, default='')

    class Meta:
        model = GrowthPhoto
        fields = '__all__'
        read_only_fields = ['id', 'uploaded_by', 'created_at']


class DailyRecordSerializer(serializers.ModelSerializer):
    photos = GrowthPhotoSerializer(many=True, read_only=True)
    child_name = serializers.CharField(source='child.name', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.username', read_only=True, default='')

    class Meta:
        model = DailyRecord
        fields = '__all__'
        read_only_fields = ['id', 'recorded_by', 'created_at', 'updated_at']


class DailyRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyRecord
        fields = '__all__'
        read_only_fields = ['id', 'recorded_by', 'created_at', 'updated_at']
