from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from datetime import datetime

from .models import Repair, RepairPhoto, RepairNote
from .serializers import (
    RepairSerializer, RepairDetailSerializer,
    RepairPhotoSerializer, RepairNoteSerializer
)


class RepairViewSet(viewsets.ModelViewSet):
    queryset = Repair.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['project', 'category', 'priority', 'status', 'assigned_to']
    search_fields = ['code', 'title', 'description', 'location', 'reporter_name', 'reporter_phone']
    ordering_fields = ['created_at', 'priority']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RepairDetailSerializer
        return RepairSerializer

    def get_queryset(self):
        return super().get_queryset().annotate(photo_count=Count('photos'))

    def perform_create(self, serializer):
        repair = serializer.save(created_by=self.request.user)
        if not repair.code:
            repair.code = f'RP{datetime.now().strftime("%Y%m%d")}{repair.id:04d}'
            repair.save()

    @action(detail=True, methods=['post'])
    def add_photo(self, request, pk=None):
        repair = self.get_object()
        serializer = RepairPhotoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(repair=repair, uploaded_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        repair = self.get_object()
        serializer = RepairNoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(repair=repair, created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        repair = self.get_object()
        assigned_to_id = request.data.get('assigned_to')
        if not assigned_to_id:
            return Response({'error': '请选择处理人'}, status=status.HTTP_400_BAD_REQUEST)
        repair.assigned_to_id = assigned_to_id
        repair.status = 'assigned'
        repair.assigned_at = datetime.now()
        repair.save()
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        repair = self.get_object()
        repair.status = 'in_progress'
        repair.save()
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        repair = self.get_object()
        material_cost = float(request.data.get('material_cost', 0))
        labor_cost = float(request.data.get('labor_cost', 0))
        resolution = request.data.get('resolution', '')

        repair.status = 'completed'
        repair.material_cost = material_cost
        repair.labor_cost = labor_cost
        repair.total_cost = material_cost + labor_cost
        repair.resolution = resolution
        repair.completed_at = datetime.now()

        if 'client_feedback' in request.data:
            repair.client_feedback = request.data['client_feedback']
        if 'satisfaction' in request.data:
            repair.satisfaction = request.data['satisfaction']

        repair.save()
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        repair = self.get_object()
        repair.status = 'cancelled'
        repair.save()
        return Response({'status': 'success'})

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        total = Repair.objects.count()
        by_status = {}
        for s, _ in Repair.STATUS_CHOICES:
            by_status[s] = Repair.objects.filter(status=s).count()
        by_priority = {}
        for p, _ in Repair.PRIORITY_CHOICES:
            by_priority[p] = Repair.objects.filter(priority=p).count()
        by_category = {}
        for c, _ in Repair.CATEGORY_CHOICES:
            by_category[c] = Repair.objects.filter(category=c).count()

        return Response({
            'total': total,
            'by_status': by_status,
            'by_priority': by_priority,
            'by_category': by_category,
        })


class RepairPhotoViewSet(viewsets.ModelViewSet):
    queryset = RepairPhoto.objects.all()
    serializer_class = RepairPhotoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['repair']


class RepairNoteViewSet(viewsets.ModelViewSet):
    queryset = RepairNote.objects.all()
    serializer_class = RepairNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['repair']
