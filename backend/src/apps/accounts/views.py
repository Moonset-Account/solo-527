from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from knox.models import AuthToken
from django.contrib.auth import get_user_model
from .models import TeacherProfile, ParentProfile
from .serializers import (
    UserSerializer, UserCreateSerializer, TeacherProfileSerializer,
    ParentProfileSerializer, LoginSerializer
)
from core.permissions import IsDirector, IsTeacherOrDirector

User = get_user_model()


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token_instance, token = AuthToken.objects.create(user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token,
            'expiry': token_instance.expiry
        })


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_deleted=False)
    serializer_class = UserSerializer
    permission_classes = [IsDirector]
    filterset_fields = ['role', 'is_active']
    search_fields = ['name', 'phone']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.updated_by = self.request.user
        instance.save()

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        data = serializer.data
        if hasattr(request.user, 'teacher_profile'):
            data['teacher_profile'] = TeacherProfileSerializer(request.user.teacher_profile).data
        if hasattr(request.user, 'parent_profile'):
            data['parent_profile'] = ParentProfileSerializer(request.user.parent_profile).data
        return Response(data)


class TeacherProfileViewSet(viewsets.ModelViewSet):
    queryset = TeacherProfile.objects.filter(is_deleted=False)
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsDirector]
    filterset_fields = ['classes']
    search_fields = ['user__name', 'employee_id']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class ParentProfileViewSet(viewsets.ModelViewSet):
    queryset = ParentProfile.objects.filter(is_deleted=False)
    serializer_class = ParentProfileSerializer
    permission_classes = [IsTeacherOrDirector]
    search_fields = ['user__name', 'user__phone']

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == 'teacher':
            class_ids = self.request.user.teacher_profile.classes.values_list('id', flat=True)
            qs = qs.filter(user__children__child_class_id__in=class_ids).distinct()
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
