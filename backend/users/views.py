from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from knox.views import LoginView as KnoxLoginView
from django.contrib.auth import login
from .models import User
from .serializers import (
    UserSerializer, UserCreateSerializer,
    LoginSerializer, ChangePasswordSerializer
)
from common.views import BaseViewSet
from common.permissions import IsRepresentative


class UserViewSet(BaseViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    search_fields = ['username', 'first_name', 'last_name', 'phone', 'community']
    filterset_fields = ['role', 'community', 'building', 'is_active_resident']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ['create', 'login']:
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request, pk=None):
        user = self.get_object()
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            if not user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {'error': '原密码错误'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': '密码修改成功'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsRepresentative])
    def toggle_qualification(self, request, pk=None):
        user = self.get_object()
        user.is_active_resident = not user.is_active_resident
        user.qualification_remark = request.data.get('remark', '')
        user.save()
        return Response({
            'message': '资格状态已更新',
            'is_active_resident': user.is_active_resident
        })


class LoginView(KnoxLoginView):
    permission_classes = (AllowAny,)

    def post(self, request, format=None):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        login(request, user)
        response = super().post(request, format=None)
        response.data['user'] = UserSerializer(user).data
        return response
