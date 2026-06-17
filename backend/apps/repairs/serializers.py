from rest_framework import serializers
from .models import Repair, RepairPhoto, RepairNote


class RepairPhotoSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)

    class Meta:
        model = RepairPhoto
        fields = ['id', 'image', 'title', 'uploaded_by', 'uploaded_by_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class RepairNoteSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = RepairNote
        fields = ['id', 'content', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class RepairSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    project_code = serializers.CharField(source='project.code', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    photo_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Repair
        fields = ['id', 'project', 'project_code', 'project_name', 'code', 'title',
                  'category', 'category_display', 'priority', 'priority_display',
                  'status', 'status_display', 'reporter_name', 'reporter_phone',
                  'location', 'description', 'material_cost', 'labor_cost', 'total_cost',
                  'assigned_to', 'assigned_to_name', 'assigned_at', 'completed_at',
                  'resolution', 'client_feedback', 'satisfaction', 'created_by',
                  'created_by_name', 'photo_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'code', 'total_cost', 'assigned_at', 'completed_at',
                            'created_at', 'updated_at']


class RepairDetailSerializer(RepairSerializer):
    photos = RepairPhotoSerializer(many=True, read_only=True)
    notes = RepairNoteSerializer(many=True, read_only=True)

    class Meta(RepairSerializer.Meta):
        fields = RepairSerializer.Meta.fields + ['photos', 'notes']
