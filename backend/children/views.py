from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from common.permissions import IsAdmin, IsAdminOrTeacher, IsAdminOrTeacherOrReadOnly
from common.audit import log_audit
from common.services import BaseService
from .models import ClassGroup, Child, ParentChildRelation, AuthorizedPickupPerson
from .serializers import (
    ClassGroupSerializer, ChildSerializer, ChildListSerializer,
    ParentChildRelationSerializer, AuthorizedPickupPersonSerializer,
)


class ClassGroupListView(generics.ListCreateAPIView):
    queryset = ClassGroup.objects.all()
    serializer_class = ClassGroupSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeacherOrReadOnly]
    filterset_fields = ['teacher']
    search_fields = ['name']


class ClassGroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ClassGroup.objects.all()
    serializer_class = ClassGroupSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]


class ChildListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrTeacherOrReadOnly]
    filterset_fields = ['class_group', 'is_active', 'gender']
    search_fields = ['name']

    def get_queryset(self):
        qs = Child.objects.select_related('class_group').order_by('name')
        user = self.request.user
        if user.role == 'teacher':
            qs = qs.filter(class_group__teacher=user)
        elif user.role == 'parent':
            qs = qs.filter(parent_relations__parent=user)
        return qs.distinct()

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ChildListSerializer
        return ChildSerializer

    def perform_create(self, serializer):
        obj = serializer.save()
        log_audit(self.request.user, 'create', 'Child', obj.pk)


class ChildDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Child.objects.select_related('class_group').prefetch_related(
        'parent_relations__parent', 'authorized_pickups'
    ).all()
    serializer_class = ChildSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

    def perform_update(self, serializer):
        obj = serializer.save()
        log_audit(self.request.user, 'update', 'Child', obj.pk)


class ParentChildRelationView(generics.ListCreateAPIView):
    queryset = ParentChildRelation.objects.all()
    serializer_class = ParentChildRelationSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]
    filterset_fields = ['parent', 'child', 'relation']


class AuthorizedPickupPersonListView(generics.ListCreateAPIView):
    serializer_class = AuthorizedPickupPersonSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeacherOrReadOnly]
    filterset_fields = ['child', 'is_active']

    def get_queryset(self):
        qs = AuthorizedPickupPerson.objects.all()
        user = self.request.user
        child_pk = self.kwargs.get('child_pk')
        if child_pk:
            qs = qs.filter(child_id=child_pk)
        if user.role == 'parent':
            qs = qs.filter(child__parent_relations__parent=user)
        elif user.role == 'teacher':
            qs = qs.filter(child__class_group__teacher=user)
        return qs.distinct()

    def perform_create(self, serializer):
        obj = serializer.save(added_by=self.request.user)
        log_audit(self.request.user, 'create', 'AuthorizedPickupPerson', obj.pk)


class AuthorizedPickupPersonDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AuthorizedPickupPersonSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

    def get_queryset(self):
        return AuthorizedPickupPerson.objects.all()
