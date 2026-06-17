from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import Project, ProjectPhoto, ProjectAttachment, ProjectNote, ChangeHistory
from .serializers import (
    ProjectSerializer, ProjectDetailSerializer, ProjectPhotoSerializer,
    ProjectAttachmentSerializer, ProjectNoteSerializer, ChangeHistorySerializer
)


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'project_manager', 'material_staff']
    search_fields = ['name', 'code', 'address', 'client_name', 'client_phone']
    ordering_fields = ['created_at', 'updated_at', 'name', 'code']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        return ProjectSerializer

    def get_queryset(self):
        qs = super().get_queryset().annotate(photo_count=Count('photos'))
        user = self.request.user
        if user.role in ['worker', 'inspector']:
            return qs
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        project = self.get_object()
        new_status = request.data.get('status')
        if new_status not in dict(Project.STATUS_CHOICES):
            return Response({'error': '无效的状态'}, status=status.HTTP_400_BAD_REQUEST)
        old_status = project.status
        project.status = new_status
        project.save()
        ChangeHistory.objects.create(
            content_type='project',
            object_id=project.id,
            field_name='status',
            old_value=old_status,
            new_value=new_status,
            changed_by=request.user,
            remark='状态变更'
        )
        return Response({'status': 'success', 'new_status': new_status})

    @action(detail=True, methods=['get'])
    def photos(self, request, pk=None):
        project = self.get_object()
        photos = project.photos.all()
        serializer = ProjectPhotoSerializer(photos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_photo(self, request, pk=None):
        project = self.get_object()
        serializer = ProjectPhotoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project=project, uploaded_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_attachment(self, request, pk=None):
        project = self.get_object()
        serializer = ProjectAttachmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project=project, uploaded_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        project = self.get_object()
        serializer = ProjectNoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project=project, created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectPhotoViewSet(viewsets.ModelViewSet):
    queryset = ProjectPhoto.objects.all()
    serializer_class = ProjectPhotoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['project', 'uploaded_by']
    search_fields = ['title', 'description']

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class ProjectAttachmentViewSet(viewsets.ModelViewSet):
    queryset = ProjectAttachment.objects.all()
    serializer_class = ProjectAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['project', 'uploaded_by']

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class ChangeHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ChangeHistory.objects.all()
    serializer_class = ChangeHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['content_type', 'object_id', 'changed_by']
