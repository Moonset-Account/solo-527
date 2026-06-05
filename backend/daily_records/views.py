from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from common.permissions import IsAdminOrTeacher, IsAdminOrTeacherOrReadOnly
from common.audit import log_audit
from .models import DailyRecord, GrowthPhoto
from .serializers import DailyRecordSerializer, DailyRecordCreateSerializer, GrowthPhotoSerializer


class DailyRecordListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrTeacherOrReadOnly]
    filterset_fields = ['child', 'date', 'child__class_group']
    search_fields = ['child__name']

    def get_queryset(self):
        qs = DailyRecord.objects.select_related('child', 'recorded_by').prefetch_related('photos').order_by('-date')
        if self.request.user.role == 'teacher':
            qs = qs.filter(child__class_group__teacher=self.request.user)
        elif self.request.user.role == 'parent':
            qs = qs.filter(child__parent_relations__parent=self.request.user)
        return qs.distinct()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DailyRecordCreateSerializer
        return DailyRecordSerializer

    def perform_create(self, serializer):
        obj = serializer.save(recorded_by=self.request.user)
        log_audit(self.request.user, 'create', 'DailyRecord', obj.pk)


class DailyRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DailyRecordSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

    def get_queryset(self):
        return DailyRecord.objects.select_related('child', 'recorded_by').prefetch_related('photos')

    def perform_update(self, serializer):
        obj = serializer.save()
        log_audit(self.request.user, 'update', 'DailyRecord', obj.pk)


class GrowthPhotoListView(generics.ListCreateAPIView):
    serializer_class = GrowthPhotoSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]
    filterset_fields = ['record']

    def get_queryset(self):
        qs = GrowthPhoto.objects.all()
        if self.request.user.role == 'teacher':
            qs = qs.filter(record__child__class_group__teacher=self.request.user)
        return qs

    def perform_create(self, serializer):
        obj = serializer.save(uploaded_by=self.request.user)
        log_audit(self.request.user, 'create', 'GrowthPhoto', obj.pk)
