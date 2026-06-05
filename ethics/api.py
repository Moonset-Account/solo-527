from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Project, MaterialVersion, ReviewComment, Material, Resubmission
from .serializers import (
    ProjectSerializer, MaterialVersionSerializer,
    ReviewCommentSerializer, ResubmissionSerializer
)


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'department']
    search_fields = ['title', 'project_code', 'principal_investigator__first_name']
    ordering_fields = ['created_at', 'updated_at', 'project_code']

    def get_queryset(self):
        user = self.request.user
        queryset = Project.objects.all().select_related(
            'principal_investigator'
        ).prefetch_related('researchers', 'materials')

        if not (user.is_secretary() or user.is_admin()):
            if user.is_committee():
                from .models import ReviewAssignment
                assigned_ids = ReviewAssignment.objects.filter(
                    committee_member=user
                ).values_list('project_id', flat=True)
                queryset = queryset.filter(id__in=assigned_ids)
            else:
                queryset = queryset.filter(
                    principal_investigator=user
                ) | queryset.filter(researchers=user)

        return queryset.distinct()

    @action(detail=True, methods=['get'])
    def materials(self, request, pk=None):
        project = self.get_object()
        materials = project.materials.select_related(
            'material_type', 'current_version'
        ).prefetch_related('versions__uploader')
        data = []
        for m in materials:
            versions = MaterialVersionSerializer(
                m.versions.all(), many=True, context={'request': request}
            ).data
            data.append({
                'id': m.id,
                'material_type': {
                    'id': m.material_type.id,
                    'name': m.material_type.name
                },
                'current_version': MaterialVersionSerializer(
                    m.current_version, context={'request': request}
                ).data if m.current_version else None,
                'versions': versions,
            })
        return Response(data)

    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        project = self.get_object()
        comments = project.review_comments.select_related(
            'clause', 'reviewer', 'material_version'
        )
        serializer = ReviewCommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def resubmissions(self, request, pk=None):
        project = self.get_object()
        resubmissions = project.resubmissions.select_related(
            'submitter', 'material_version'
        ).prefetch_related('addressed_comments')
        serializer = ResubmissionSerializer(resubmissions, many=True, context={'request': request})
        return Response(serializer.data)


class MaterialVersionViewSet(viewsets.ModelViewSet):
    serializer_class = MaterialVersionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['material', 'material__project']
    ordering_fields = ['version_number', 'created_at']

    def get_queryset(self):
        user = self.request.user
        queryset = MaterialVersion.objects.all().select_related(
            'material__project', 'uploader'
        )

        if not (user.is_secretary() or user.is_admin()):
            if user.is_committee():
                from .models import ReviewAssignment
                assigned_project_ids = ReviewAssignment.objects.filter(
                    committee_member=user
                ).values_list('project_id', flat=True)
                queryset = queryset.filter(material__project_id__in=assigned_project_ids)
            else:
                queryset = queryset.filter(
                    material__project__principal_investigator=user
                ) | queryset.filter(
                    material__project__researchers=user
                )

        return queryset.distinct()


class ReviewCommentViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['project', 'status', 'reviewer', 'clause']
    ordering_fields = ['created_at', 'updated_at']

    def get_queryset(self):
        user = self.request.user
        queryset = ReviewComment.objects.all().select_related(
            'project', 'clause', 'reviewer', 'material_version'
        )

        if not (user.is_secretary() or user.is_admin()):
            if user.is_committee():
                queryset = queryset.filter(reviewer=user)
                from .models import ReviewAssignment
                assigned_project_ids = ReviewAssignment.objects.filter(
                    committee_member=user
                ).values_list('project_id', flat=True)
                queryset = queryset | ReviewComment.objects.filter(
                    project_id__in=assigned_project_ids
                )
            else:
                queryset = queryset.filter(
                    project__principal_investigator=user
                ) | queryset.filter(
                    project__researchers=user
                )

        return queryset.distinct()
