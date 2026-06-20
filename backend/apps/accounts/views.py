from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from .models import Organization, User
from .serializers import (
    OrganizationSerializer, UserSerializer, UserCreateSerializer,
    UserUpdateSerializer, LoginSerializer, PasswordChangeSerializer
)
from apps.permissions import IsAdmin


class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'created_at']


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['organization', 'role', 'is_active', 'is_admin']
    search_fields = ['username', 'name', 'email']
    ordering_fields = ['username', 'created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsAdmin()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_admin:
            qs = qs.filter(organization=self.request.user.organization)
        return qs

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
        return Response({'message': '密码修改成功'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def reset_password(self, request, pk=None):
        user = self.get_object()
        user.set_password('123456')
        user.save()
        return Response({'message': '密码已重置为 123456'})


class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=['post'])
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        })

    @action(detail=False, methods=['post'])
    def logout(self, request):
        if request.user.is_authenticated:
            Token.objects.filter(user=request.user).delete()
        return Response({'message': '登出成功'}, status=status.HTTP_200_OK)
