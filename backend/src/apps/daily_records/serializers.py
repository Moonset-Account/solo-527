from rest_framework import serializers
from .models import DailyRecord, NapRecord, MealRecord, ActivityRecord, GrowthRecord
from apps.children.serializers import ChildSerializer


class NapRecordSerializer(serializers.ModelSerializer):
    quality_display = serializers.CharField(source='get_quality_display', read_only=True)

    class Meta:
        model = NapRecord
        fields = ['id', 'daily_record', 'start_time', 'end_time', 'quality', 'quality_display', 'notes']


class MealRecordSerializer(serializers.ModelSerializer):
    meal_type_display = serializers.CharField(source='get_meal_type_display', read_only=True)
    appetite_display = serializers.CharField(source='get_appetite_display', read_only=True)

    class Meta:
        model = MealRecord
        fields = ['id', 'daily_record', 'meal_type', 'meal_type_display', 'menu',
                  'appetite', 'appetite_display', 'portion', 'notes']


class ActivityRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityRecord
        fields = ['id', 'daily_record', 'activity_type', 'description', 'duration', 'photos', 'notes']


class DailyRecordSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    nap_records = NapRecordSerializer(many=True, read_only=True)
    meal_records = MealRecordSerializer(many=True, read_only=True)
    activity_records = ActivityRecordSerializer(many=True, read_only=True)

    class Meta:
        model = DailyRecord
        fields = ['id', 'child', 'child_name', 'record_date', 'teacher', 'teacher_name',
                  'mood', 'health_status', 'notes', 'nap_records', 'meal_records', 'activity_records']


class GrowthRecordSerializer(serializers.ModelSerializer):
    child_name = serializers.CharField(source='child.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)

    class Meta:
        model = GrowthRecord
        fields = ['id', 'child', 'child_name', 'record_date', 'height', 'weight',
                  'head_circumference', 'bmi', 'teacher', 'teacher_name', 'notes']
        read_only_fields = ['bmi']
