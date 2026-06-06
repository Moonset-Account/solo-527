from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import DailyRecord, NapRecord, MealRecord, ActivityRecord, GrowthRecord
from .serializers import (
    DailyRecordSerializer, NapRecordSerializer, MealRecordSerializer,
    ActivityRecordSerializer, GrowthRecordSerializer
)
from core.permissions import IsTeacherOrDirector, IsParent


class DailyRecordViewSet(viewsets.ModelViewSet):
    queryset = DailyRecord.objects.filter(is_deleted=False)
    serializer_class = DailyRecordSerializer
    permission_classes = [IsTeacherOrDirector | IsParent]
    filterset_fields = ['child', 'record_date', 'teacher']
    search_fields = ['child__name']
    ordering_fields = ['record_date', 'created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'teacher':
            class_ids = user.teacher_profile.classes.values_list('id', flat=True)
            qs = qs.filter(child__child_class_id__in=class_ids)
        elif user.role == 'parent':
            qs = qs.filter(child__parents=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user, created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class NapRecordViewSet(viewsets.ModelViewSet):
    queryset = NapRecord.objects.filter(is_deleted=False)
    serializer_class = NapRecordSerializer
    permission_classes = [IsTeacherOrDirector]
    filterset_fields = ['daily_record']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class MealRecordViewSet(viewsets.ModelViewSet):
    queryset = MealRecord.objects.filter(is_deleted=False)
    serializer_class = MealRecordSerializer
    permission_classes = [IsTeacherOrDirector]
    filterset_fields = ['daily_record', 'meal_type']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class ActivityRecordViewSet(viewsets.ModelViewSet):
    queryset = ActivityRecord.objects.filter(is_deleted=False)
    serializer_class = ActivityRecordSerializer
    permission_classes = [IsTeacherOrDirector]
    filterset_fields = ['daily_record', 'activity_type']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class GrowthRecordViewSet(viewsets.ModelViewSet):
    queryset = GrowthRecord.objects.filter(is_deleted=False)
    serializer_class = GrowthRecordSerializer
    permission_classes = [IsTeacherOrDirector | IsParent]
    filterset_fields = ['child', 'record_date']
    ordering_fields = ['record_date']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'parent':
            qs = qs.filter(child__parents=user)
        elif user.role == 'teacher':
            class_ids = user.teacher_profile.classes.values_list('id', flat=True)
            qs = qs.filter(child__child_class_id__in=class_ids)
        return qs

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user, created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
