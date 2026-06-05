from rest_framework import serializers
from .models import (
    Project, MaterialVersion, ReviewComment,
    Resubmission, Material, ReviewAssignment
)


class ProjectSerializer(serializers.ModelSerializer):
    principal_investigator_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'project_code', 'title', 'principal_investigator',
            'principal_investigator_name', 'department', 'description',
            'status', 'status_display', 'created_at', 'updated_at',
            'submitted_at', 'archived_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'submitted_at', 'archived_at']

    def get_principal_investigator_name(self, obj):
        return obj.principal_investigator.get_full_name() or obj.principal_investigator.username


class MaterialVersionSerializer(serializers.ModelSerializer):
    uploader_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    material_type_name = serializers.SerializerMethodField()

    class Meta:
        model = MaterialVersion
        fields = [
            'id', 'material', 'version_number', 'title', 'file',
            'file_url', 'description', 'uploader', 'uploader_name',
            'material_type_name', 'is_archived', 'created_at'
        ]
        read_only_fields = ['version_number', 'created_at']

    def get_uploader_name(self, obj):
        return obj.uploader.get_full_name() or obj.uploader.username

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

    def get_material_type_name(self, obj):
        return obj.material.material_type.name


class ReviewCommentSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.SerializerMethodField()
    clause_info = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = ReviewComment
        fields = [
            'id', 'project', 'material_version', 'clause', 'clause_info',
            'reviewer', 'reviewer_name', 'content', 'status',
            'status_display', 'created_at', 'updated_at'
        ]
        read_only_fields = ['reviewer', 'created_at', 'updated_at']

    def get_reviewer_name(self, obj):
        return obj.reviewer.get_full_name() or obj.reviewer.username

    def get_clause_info(self, obj):
        if obj.clause:
            return {
                'id': obj.clause.id,
                'clause_number': obj.clause.clause_number,
                'title': obj.clause.title
            }
        return None


class ResubmissionSerializer(serializers.ModelSerializer):
    submitter_name = serializers.SerializerMethodField()
    addressed_comment_ids = serializers.SerializerMethodField()

    class Meta:
        model = Resubmission
        fields = [
            'id', 'project', 'material_version', 'submitter',
            'submitter_name', 'addressed_comment_ids', 'response_note',
            'submitted_at'
        ]
        read_only_fields = ['submitter', 'submitted_at']

    def get_submitter_name(self, obj):
        return obj.submitter.get_full_name() or obj.submitter.username

    def get_addressed_comment_ids(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_committee():
            return list(obj.addressed_comments.values_list('id', flat=True))

        from .models import ReviewAssignment, Material, MaterialVersion
        from django.db.models import Q

        assignment = ReviewAssignment.objects.filter(
            project=obj.project, committee_member=request.user
        ).prefetch_related('material_types').first()

        if not assignment:
            return []

        assigned_type_ids = assignment.material_types.values_list('id', flat=True)
        material_ids = Material.objects.filter(
            project=obj.project, material_type_id__in=assigned_type_ids
        ).values_list('id', flat=True)
        version_ids = MaterialVersion.objects.filter(
            material_id__in=material_ids
        ).values_list('id', flat=True)

        visible_comments = obj.addressed_comments.filter(
            Q(material_version_id__in=version_ids) | Q(reviewer=request.user)
        )
        return list(visible_comments.values_list('id', flat=True))
