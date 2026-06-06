from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count
from .models import ChildClass, Child, ParentChildRelation, AuthorizedPickupPerson
from .serializers import (
    ChildClassSerializer, ChildSerializer, ChildListSerializer,
    ParentChildRelationSerializer, AuthorizedPickupPersonSerializer
)
from core.permissions import IsTeacherOrDirector, IsParent, check_class_permission


class ChildClassViewSet(viewsets.ModelViewSet):
    queryset = ChildClass.objects.filter(is_deleted=False).annotate(student_count=Count('children'))
    serializer_class = ChildClassSerializer
    permission_classes = [IsTeacherOrDirector]
    search_fields = ['name']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class ChildViewSet(viewsets.ModelViewSet):
    queryset = Child.objects.filter(is_deleted=False)
    permission_classes = [IsTeacherOrDirector | IsParent]
    filterset_fields = ['child_class', 'status', 'gender']
    search_fields = ['name', 'id_card']

    def get_serializer_class(self):
        if self.action == 'list':
            return ChildListSerializer
        return ChildSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'teacher':
            class_ids = user.teacher_profile.classes.values_list('id', flat=True)
            qs = qs.filter(child_class_id__in=class_ids)
        elif user.role == 'parent':
            qs = qs.filter(parents=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['get'])
    def authorized_persons(self, request, pk=None):
        child = self.get_object()
        persons = child.authorized_persons.filter(is_deleted=False, is_active=True)
        serializer = AuthorizedPickupPersonSerializer(persons, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def parents(self, request, pk=None):
        child = self.get_object()
        relations = child.parent_relations.filter(is_deleted=False)
        serializer = ParentChildRelationSerializer(relations, many=True)
        return Response(serializer.data)


class AuthorizedPickupPersonViewSet(viewsets.ModelViewSet):
    queryset = AuthorizedPickupPerson.objects.filter(is_deleted=False)
    serializer_class = AuthorizedPickupPersonSerializer
    permission_classes = [IsTeacherOrDirector]
    filterset_fields = ['child', 'is_active']
    search_fields = ['name', 'phone']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'teacher':
            class_ids = user.teacher_profile.classes.values_list('id', flat=True)
            qs = qs.filter(child__child_class_id__in=class_ids)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class ParentChildRelationViewSet(viewsets.ModelViewSet):
    queryset = ParentChildRelation.objects.filter(is_deleted=False)
    serializer_class = ParentChildRelationSerializer
    permission_classes = [IsTeacherOrDirector]
    filterset_fields = ['child', 'parent']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
