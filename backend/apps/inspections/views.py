from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from datetime import datetime

from .models import Inspection, InspectionItem, InspectionPhoto
from .serializers import (
    InspectionSerializer, InspectionDetailSerializer,
    InspectionItemSerializer, InspectionPhotoSerializer
)
from apps.notifications.models import Notification
from apps.users.models import User


class InspectionViewSet(viewsets.ModelViewSet):
    queryset = Inspection.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['project', 'type', 'result', 'rectification_required', 'inspector']
    search_fields = ['title', 'description', 'location', 'project__name', 'project__code']
    ordering_fields = ['inspection_date', 'created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return InspectionDetailSerializer
        return InspectionSerializer

    def get_queryset(self):
        return super().get_queryset().annotate(
            photo_count=Count('photos'),
            fail_count=Count('items', filter=Q(items__result='fail'))
        )

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        inspection = self.get_object()
        serializer = InspectionItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(inspection=inspection)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_photo(self, request, pk=None):
        inspection = self.get_object()
        serializer = InspectionPhotoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(inspection=inspection, uploaded_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def submit_result(self, request, pk=None):
        inspection = self.get_object()
        result = request.data.get('result')
        description = request.data.get('description', '')
        items_data = request.data.get('items', [])

        if result not in dict(Inspection.RESULT_CHOICES):
            return Response({'error': '无效的检查结果'}, status=status.HTTP_400_BAD_REQUEST)

        inspection.result = result
        inspection.description = description
        if result == 'fail':
            inspection.rectification_required = True
        inspection.save()

        for item_data in items_data:
            item_id = item_data.get('id')
            if item_id:
                InspectionItem.objects.filter(id=item_id).update(
                    result=item_data.get('result', 'pass'),
                    description=item_data.get('description', '')
                )

        if result == 'fail':
            self._notify_material_staff(inspection)

        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def mark_rectified(self, request, pk=None):
        inspection = self.get_object()
        inspection.result = 'pass'
        inspection.rectification_required = False
        inspection.rectified_by = request.user
        inspection.rectified_at = datetime.now()
        inspection.rectification_note = request.data.get('note', '')
        inspection.save()
        return Response({'status': 'success'})

    def _notify_material_staff(self, inspection):
        material_staff_list = User.objects.filter(role='material_staff', is_active=True)
        if material_staff_list.exists():
            notification = Notification.objects.create(
                type='inspection_fail',
                level='warning',
                title=f'巡检不合格: {inspection.project.code} - {inspection.title}',
                message=f'项目 {inspection.project.name} 的巡检 "{inspection.title}" 检查结果不合格，请关注材料员关注材料问题。',
                related_type='inspection',
                related_id=inspection.id,
                created_by=self.request.user,
            )
            notification.recipients.set(material_staff_list)

        if inspection.project.material_staff:
            notification.recipients.add(inspection.project.material_staff)


class InspectionItemViewSet(viewsets.ModelViewSet):
    queryset = InspectionItem.objects.all()
    serializer_class = InspectionItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['inspection', 'result']


class InspectionPhotoViewSet(viewsets.ModelViewSet):
    queryset = InspectionPhoto.objects.all()
    serializer_class = InspectionPhotoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['inspection', 'is_issue']
