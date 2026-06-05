from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import update_session_auth_hash
from .models import User, SystemLog
from .serializers import UserSerializer, UserCreateSerializer, LoginSerializer, PasswordChangeSerializer
from .permissions import IsAdmin


class AuthViewSet(viewsets.GenericViewSet):
    queryset = User.objects.all()
    
    def get_permissions(self):
        if self.action in ['login', 'refresh']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.action == 'login':
            return LoginSerializer
        elif self.action == 'change_password':
            return PasswordChangeSerializer
        elif self.action == 'register':
            return UserCreateSerializer
        return UserSerializer
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        refresh = RefreshToken.for_user(user)
        
        SystemLog.objects.create(
            log_type=SystemLog.LOG_TYPE_LOGIN,
            user=user,
            action='用户登录',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': '登出成功'})
        except Exception:
            return Response({'message': '登出成功'})
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        if not request.user.check_password(serializer.validated_data['old_password']):
            return Response({'error': '原密码错误'}, status=status.HTTP_400_BAD_REQUEST)
        
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        update_session_auth_hash(request, request.user)
        
        return Response({'message': '密码修改成功'})
    
    @action(detail=False, methods=['post'], permission_classes=[IsAdmin])
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.is_manager:
            queryset = queryset.filter(id=self.request.user.id)
        return queryset
