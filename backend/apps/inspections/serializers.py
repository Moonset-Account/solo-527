from rest_framework import serializers
from .models import Inspection, InspectionItem, InspectionPhoto


class InspectionPhotoSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)

    class Meta:
        model = InspectionPhoto
        fields = ['id', 'image', 'title', 'description', 'is_issue', 'uploaded_by',
                  'uploaded_by_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class InspectionItemSerializer(serializers.ModelSerializer):
    result_display = serializers.CharField(source='get_result_display', read_only=True)

    class Meta:
        model = InspectionItem
        fields = ['id', 'name', 'standard', 'result', 'result_display', 'description', 'sort_order']
        read_only_fields = ['id']


class InspectionSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    result_display = serializers.CharField(source='get_result_display', read_only=True)
    project_code = serializers.CharField(source='project.code', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    inspector_name = serializers.CharField(source='inspector.get_full_name', read_only=True)
    rectified_by_name = serializers.CharField(source='rectified_by.get_full_name', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    photo_count = serializers.IntegerField(read_only=True)
    fail_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Inspection
        fields = ['id', 'project', 'project_code', 'project_name', 'type', 'type_display',
                  'title', 'inspection_date', 'location', 'result', 'result_display',
                  'description', 'inspector', 'inspector_name', 'rectification_required',
                  'rectification_deadline', 'rectified_by', 'rectified_by_name',
                  'rectified_at', 'rectification_note', 'created_by', 'created_by_name',
                  'photo_count', 'fail_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'rectified_at', 'created_at', 'updated_at']


class InspectionDetailSerializer(InspectionSerializer):
    items = InspectionItemSerializer(many=True, read_only=True)
    photos = InspectionPhotoSerializer(many=True, read_only=True)

    class Meta(InspectionSerializer.Meta):
        fields = InspectionSerializer.Meta.fields + ['items', 'photos']
