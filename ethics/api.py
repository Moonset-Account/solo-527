from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Project, MaterialVersion, ReviewComment, Material, Resubmission, ReviewAssignment
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
                assigned_ids = ReviewAssignment.objects.filter(
                    committee_member=user
                ).values_list('project_id', flat=True)
                queryset = queryset.filter(id__in=assigned_ids)
            else:
                queryset = queryset.filter(
                    principal_investigator=user
                ) | queryset.filter(researchers=user)

        return queryset.distinct()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_archived():
            return Response(
                {'detail': '已归档的课题无法修改'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_archived():
            return Response(
                {'detail': '已归档的课题无法修改'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_archived():
            return Response(
                {'detail': '已归档的课题无法删除'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def materials(self, request, pk=None):
        project = self.get_object()
        user = request.user
        materials = project.materials.select_related(
            'material_type', 'current_version'
        ).prefetch_related('versions__uploader')

        if user.is_committee():
            assignment = ReviewAssignment.objects.filter(
                project=project, committee_member=user
            ).prefetch_related('material_types').first()
            if assignment:
                assigned_type_ids = assignment.material_types.values_list('id', flat=True)
                materials = materials.filter(material_type_id__in=assigned_type_ids)

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
        user = request.user
        comments = project.review_comments.select_related(
            'clause', 'reviewer', 'material_version'
        )

        if user.is_committee():
            assignment = ReviewAssignment.objects.filter(
                project=project, committee_member=user
            ).prefetch_related('material_types').first()
            if assignment:
                assigned_type_ids = assignment.material_types.values_list('id', flat=True)
                material_ids = project.materials.filter(
                    material_type_id__in=assigned_type_ids
                ).values_list('id', flat=True)
                version_ids = MaterialVersion.objects.filter(
                    material_id__in=material_ids
                ).values_list('id', flat=True)
                comments = comments.filter(
                    Q(material_version_id__in=version_ids) | Q(reviewer=user)
                )

        serializer = ReviewCommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def resubmissions(self, request, pk=None):
        project = self.get_object()
        user = request.user
        resubmissions = project.resubmissions.select_related(
            'submitter', 'material_version'
        ).prefetch_related('addressed_comments')

        if user.is_committee():
            assignment = ReviewAssignment.objects.filter(
                project=project, committee_member=user
            ).prefetch_related('material_types').first()
            if assignment:
                assigned_type_ids = assignment.material_types.values_list('id', flat=True)
                material_ids = project.materials.filter(
                    material_type_id__in=assigned_type_ids
                ).values_list('id', flat=True)
                version_ids = MaterialVersion.objects.filter(
                    material_id__in=material_ids
                ).values_list('id', flat=True)
                resubmissions = resubmissions.filter(material_version_id__in=version_ids)

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
                assignments = ReviewAssignment.objects.filter(
                    committee_member=user
                ).prefetch_related('material_types')
                project_type_map = {}
                for a in assignments:
                    type_ids = list(a.material_types.values_list('id', flat=True))
                    if a.project_id not in project_type_map:
                        project_type_map[a.project_id] = set()
                    project_type_map[a.project_id].update(type_ids)

                if project_type_map:
                    q_objects = Q()
                    for project_id, type_ids in project_type_map.items():
                        q_objects |= Q(
                            material__project_id=project_id,
                            material__material_type_id__in=type_ids
                        )
                    queryset = queryset.filter(q_objects)
                else:
                    queryset = queryset.none()
            else:
                queryset = queryset.filter(
                    material__project__principal_investigator=user
                ) | queryset.filter(
                    material__project__researchers=user
                )

        return queryset.distinct()

    def create(self, request, *args, **kwargs):
        material_id = request.data.get('material')
        if material_id:
            try:
                material = Material.objects.get(id=material_id)
                if material.project.is_archived():
                    return Response(
                        {'detail': '已归档的课题无法新增材料版本'},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Material.DoesNotExist:
                pass
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        material = serializer.validated_data.get('material')
        if material and material.project.is_archived():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('已归档的课题无法新增材料版本')
        serializer.save(uploader=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_archived or instance.material.project.is_archived():
            return Response(
                {'detail': '已归档的材料版本无法修改'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_archived or instance.material.project.is_archived():
            return Response(
                {'detail': '已归档的材料版本无法修改'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_archived or instance.material.project.is_archived():
            return Response(
                {'detail': '已归档的材料版本无法删除'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


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
                assignments = ReviewAssignment.objects.filter(
                    committee_member=user
                ).prefetch_related('material_types')
                project_type_map = {}
                for a in assignments:
                    type_ids = list(a.material_types.values_list('id', flat=True))
                    if a.project_id not in project_type_map:
                        project_type_map[a.project_id] = set()
                    project_type_map[a.project_id].update(type_ids)

                q_objects = Q(reviewer=user)
                if project_type_map:
                    for project_id, type_ids in project_type_map.items():
                        material_ids = Material.objects.filter(
                            project_id=project_id,
                            material_type_id__in=type_ids
                        ).values_list('id', flat=True)
                        version_ids = MaterialVersion.objects.filter(
                            material_id__in=material_ids
                        ).values_list('id', flat=True)
                        q_objects |= Q(
                            project_id=project_id,
                            material_version_id__in=version_ids
                        )
                queryset = queryset.filter(q_objects)
            else:
                queryset = queryset.filter(
                    project__principal_investigator=user
                ) | queryset.filter(
                    project__researchers=user
                )

        return queryset.distinct()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.project.is_archived():
            return Response(
                {'detail': '已归档课题的评审意见无法修改'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.project.is_archived():
            return Response(
                {'detail': '已归档课题的评审意见无法修改'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.project.is_archived():
            return Response(
                {'detail': '已归档课题的评审意见无法删除'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class ResubmissionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ResubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['project', 'submitter']
    ordering_fields = ['submitted_at']

    def get_queryset(self):
        user = self.request.user
        queryset = Resubmission.objects.all().select_related(
            'project', 'submitter', 'material_version'
        ).prefetch_related('addressed_comments')

        if not (user.is_secretary() or user.is_admin()):
            if user.is_committee():
                assignments = ReviewAssignment.objects.filter(
                    committee_member=user
                ).prefetch_related('material_types')
                project_type_map = {}
                for a in assignments:
                    type_ids = list(a.material_types.values_list('id', flat=True))
                    if a.project_id not in project_type_map:
                        project_type_map[a.project_id] = set()
                    project_type_map[a.project_id].update(type_ids)

                if project_type_map:
                    q_objects = Q()
                    for project_id, type_ids in project_type_map.items():
                        material_ids = Material.objects.filter(
                            project_id=project_id,
                            material_type_id__in=type_ids
                        ).values_list('id', flat=True)
                        version_ids = MaterialVersion.objects.filter(
                            material_id__in=material_ids
                        ).values_list('id', flat=True)
                        q_objects |= Q(
                            project_id=project_id,
                            material_version_id__in=version_ids
                        )
                    queryset = queryset.filter(q_objects)
                else:
                    queryset = queryset.none()
            else:
                queryset = queryset.filter(
                    project__principal_investigator=user
                ) | queryset.filter(
                    project__researchers=user
                )

        return queryset.distinct()
