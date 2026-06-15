from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters import rest_framework as filters
from django.contrib.auth import get_user_model

from .models import StaffProfile, MemberProfile, Vehicle
from .serializers import (
    UserSerializer, UserListSerializer,
    StaffProfileSerializer, MemberProfileSerializer,
    VehicleSerializer, LoginSerializer
)

User = get_user_model()


class DemoFilterMixin:
    def get_queryset(self):
        queryset = super().get_queryset()
        if not getattr(settings, 'SHOW_DEMO_DATA', False):
            if hasattr(queryset.model, 'is_demo'):
                queryset = queryset.filter(is_demo=False)
            elif hasattr(queryset.model, 'user') and hasattr(User, 'is_demo'):
                queryset = queryset.filter(user__is_demo=False)
        return queryset


class UserFilter(filters.FilterSet):
    role = filters.CharFilter(field_name='role', lookup_expr='exact')
    is_active = filters.BooleanFilter(field_name='is_active')
    created_from = filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    created_to = filters.DateFilter(field_name='created_at', lookup_expr='date__lte')

    class Meta:
        model = User
        fields = ['role', 'is_active']


class UserViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = User.objects.all()
    filter_backends = [filters.DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = UserFilter
    search_fields = ['username', 'email', 'phone']
    ordering_fields = ['created_at', 'username']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action == 'login':
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data

        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': user_data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class StaffProfileFilter(filters.FilterSet):
    department = filters.CharFilter(field_name='department', lookup_expr='icontains')
    position = filters.CharFilter(field_name='position', lookup_expr='icontains')
    hire_from = filters.DateFilter(field_name='hire_date', lookup_expr='gte')
    hire_to = filters.DateFilter(field_name='hire_date', lookup_expr='lte')

    class Meta:
        model = StaffProfile
        fields = ['department', 'position']


class StaffProfileViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = StaffProfile.objects.all()
    serializer_class = StaffProfileSerializer
    filter_backends = [filters.DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = StaffProfileFilter
    search_fields = ['employee_id', 'department', 'position', 'user__username', 'user__phone']
    ordering_fields = ['hire_date', 'employee_id']
    ordering = ['employee_id']


class MemberProfileFilter(filters.FilterSet):
    gender = filters.CharFilter(field_name='gender', lookup_expr='exact')
    level = filters.CharFilter(field_name='level', lookup_expr='exact')
    min_consumption = filters.NumberFilter(field_name='total_consumption', lookup_expr='gte')
    max_consumption = filters.NumberFilter(field_name='total_consumption', lookup_expr='lte')
    min_points = filters.NumberFilter(field_name='current_points', lookup_expr='gte')
    max_points = filters.NumberFilter(field_name='current_points', lookup_expr='lte')

    class Meta:
        model = MemberProfile
        fields = ['gender', 'level']


class MemberProfileViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = MemberProfile.objects.all()
    serializer_class = MemberProfileSerializer
    filter_backends = [filters.DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = MemberProfileFilter
    search_fields = ['user__username', 'user__phone', 'user__email', 'level']
    ordering_fields = ['total_consumption', 'current_points', 'level']
    ordering = ['-total_consumption']


class VehicleFilter(filters.FilterSet):
    brand = filters.CharFilter(field_name='brand', lookup_expr='icontains')
    model = filters.CharFilter(field_name='model', lookup_expr='icontains')
    color = filters.CharFilter(field_name='color', lookup_expr='icontains')
    is_default = filters.BooleanFilter(field_name='is_default')

    class Meta:
        model = Vehicle
        fields = ['brand', 'model', 'color', 'is_default']


class VehicleViewSet(DemoFilterMixin, viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    filter_backends = [filters.DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = VehicleFilter
    search_fields = ['plate_number', 'brand', 'model', 'vin', 'member__username', 'member__phone']
    ordering_fields = ['created_at', 'is_default']
    ordering = ['-is_default', '-created_at']
