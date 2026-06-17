from rest_framework import serializers
from .models import Project, ProjectPhoto, ProjectAttachment, ProjectNote, ChangeHistory


class ProjectPhotoSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)

    class Meta:
        model = ProjectPhoto
        fields = ['id', 'image', 'title', 'description', 'uploaded_by', 'uploaded_by_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class ProjectAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file_size = serializers.SerializerMethodField()

    class Meta:
        model = ProjectAttachment
        fields = ['id', 'file', 'name', 'description', 'file_size', 'uploaded_by', 'uploaded_by_name', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_file_size(self, obj):
        try:
            return obj.file.size
        except:
            return 0


class ProjectNoteSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = ProjectNote
        fields = ['id', 'content', 'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChangeHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)

    class Meta:
        model = ChangeHistory
        fields = ['id', 'content_type', 'object_id', 'field_name', 'old_value', 'new_value',
                  'changed_by', 'changed_by_name', 'changed_at', 'remark']
        read_only_fields = ['id', 'changed_at']


class ProjectSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    project_manager_name = serializers.CharField(source='project_manager.get_full_name', read_only=True)
    material_staff_name = serializers.CharField(source='material_staff.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    photo_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'code', 'address', 'description', 'client_name', 'client_phone',
                  'status', 'status_display', 'area', 'start_date', 'end_date',
                  'project_manager', 'project_manager_name', 'material_staff', 'material_staff_name',
                  'created_by', 'created_by_name', 'created_at', 'updated_at', 'photo_count']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectDetailSerializer(ProjectSerializer):
    photos = ProjectPhotoSerializer(many=True, read_only=True)
    attachments = ProjectAttachmentSerializer(many=True, read_only=True)
    notes = ProjectNoteSerializer(many=True, read_only=True)
    change_history = serializers.SerializerMethodField()

    class Meta(ProjectSerializer.Meta):
        fields = ProjectSerializer.Meta.fields + ['photos', 'attachments', 'notes', 'change_history']

    def get_change_history(self, obj):
        history = ChangeHistory.objects.filter(content_type='project', object_id=obj.id)
        return ChangeHistorySerializer(history, many=True).data
