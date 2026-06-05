from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import AllowAny, IsAuthenticated
from common.permissions import IsAdmin
from .serializers import UserSerializer, LoginSerializer, ChangePasswordSerializer
from .models import User
from common.audit import log_audit


class CustomObtainAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        log_audit(user, 'login', 'User', user.pk, '登录成功')
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
        })


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        log_audit(request.user, 'update', 'User', request.user.pk, '修改密码')
        return Response({'detail': '密码修改成功'})


class UserListView(generics.ListCreateAPIView):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filterset_fields = ['is_active']
    search_fields = ['username', 'phone', 'first_name', 'last_name']

    def get_queryset(self):
        qs = super().get_queryset()
        roles = self.request.query_params.get('role', '')
        if roles:
            role_list = [r.strip() for r in roles.split(',') if r.strip()]
            if role_list:
                qs = qs.filter(role__in=role_list)
        return qs

    def perform_create(self, serializer):
        user = serializer.save()
        log_audit(self.request.user, 'create', 'User', user.pk)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def perform_update(self, serializer):
        user = serializer.save()
        log_audit(self.request.user, 'update', 'User', user.pk)
