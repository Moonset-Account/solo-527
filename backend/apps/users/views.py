from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import User, RoleConfig, RoleConfigHistory, Role
from .serializers import (
    UserSerializer, UserCreateSerializer, UserUpdateSerializer,
    PasswordChangeSerializer, UserVerifySerializer,
    RoleConfigSerializer, RoleConfigHistorySerializer,
)


class IsAdminOrSelf(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role in [Role.ADMIN]:
            return True
        return obj == request.user


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'is_verified', 'is_active', 'dorm_building']
    search_fields = ['username', 'real_name', 'student_id', 'phone']
    ordering_fields = ['date_joined', 'username']

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        if self.action in ['list']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrSelf()]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': '密码修改成功'})

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        if request.user.role not in [Role.ADMIN, Role.DORM_MANAGER]:
            return Response({'detail': '无权限'}, status=status.HTTP_403_FORBIDDEN)
        user = self.get_object()
        serializer = UserVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user.is_verified = serializer.validated_data['is_verified']
        user.save()
        return Response({'detail': '审核完成', 'is_verified': user.is_verified})


class RoleConfigViewSet(viewsets.ModelViewSet):
    queryset = RoleConfig.objects.all()
    serializer_class = RoleConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def perform_update(self, serializer):
        instance = self.get_object()
        old_data = {
            'role': instance.role,
            'description': instance.description,
            'permissions': instance.permissions,
            'is_active': instance.is_active,
        }
        with transaction.atomic():
            instance = serializer.save()
            new_data = {
                'role': instance.role,
                'description': instance.description,
                'permissions': instance.permissions,
                'is_active': instance.is_active,
            }
            RoleConfigHistory.objects.create(
                role_config=instance,
                changed_by=self.request.user,
                old_data=old_data,
                new_data=new_data,
                change_reason=self.request.data.get('change_reason', '')
            )


class RoleConfigHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RoleConfigHistory.objects.all()
    serializer_class = RoleConfigHistorySerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['role_config', 'changed_by']
    ordering_fields = ['changed_at']
    permission_classes = [permissions.IsAuthenticated]
