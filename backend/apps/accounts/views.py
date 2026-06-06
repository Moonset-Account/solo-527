from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import get_user_model
from .models import Family, Child, MemberLevelConfig, PointHistory
from .serializers import (
    UserSerializer, FamilySerializer, FamilyDetailSerializer, 
    ChildSerializer, MemberLevelConfigSerializer, PointHistorySerializer
)
from apps.common.permissions import IsAdminOrLibrarian, IsOwnerOrAdmin, IsAdmin

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_deleted=False)
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['create']:
            return [AllowAny()]
        if self.action in ['list', 'destroy']:
            return [IsAdminOrLibrarian()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def point_history(self, request):
        history = PointHistory.objects.filter(user=request.user, is_deleted=False).order_by('-created_at')
        page = self.paginate_queryset(history)
        if page is not None:
            serializer = PointHistorySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = PointHistorySerializer(history, many=True)
        return Response(serializer.data)


class MemberLevelConfigViewSet(viewsets.ModelViewSet):
    queryset = MemberLevelConfig.objects.filter(is_deleted=False)
    serializer_class = MemberLevelConfigSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdmin()]


class FamilyViewSet(viewsets.ModelViewSet):
    queryset = Family.objects.filter(is_deleted=False)
    serializer_class = FamilySerializer
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return FamilyDetailSerializer
        return FamilySerializer
    
    def get_permissions(self):
        if self.action in ['list', 'create']:
            return [IsAdminOrLibrarian()]
        if self.action in ['retrieve', 'update', 'partial_update']:
            return [IsOwnerOrAdmin()]
        return [IsAdminOrLibrarian()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == 'parent':
            queryset = queryset.filter(members=self.request.user)
        return queryset
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrLibrarian()])
    def upgrade_level(self, request, pk=None):
        family = self.get_object()
        new_level = request.data.get('member_level')
        if new_level:
            family.member_level = new_level
            family.level_expire_at = request.data.get('level_expire_at')
            family.save()
            return Response({'status': 'success', 'message': '会员等级已更新'})
        return Response({'error': '请指定会员等级'}, status=400)


class ChildViewSet(viewsets.ModelViewSet):
    queryset = Child.objects.filter(is_deleted=False)
    serializer_class = ChildSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'create']:
            return [IsAuthenticated()]
        return [IsOwnerOrAdmin()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        family_id = self.request.query_params.get('family_id')
        if family_id:
            queryset = queryset.filter(family_id=family_id)
        if self.request.user.role == 'parent':
            queryset = queryset.filter(family__members=self.request.user)
        return queryset
    
    def create(self, request, *args, **kwargs):
        if request.user.role == 'parent':
            family = Family.objects.filter(members=request.user).first()
            if family:
                request.data['family_id'] = family.id
        return super().create(request, *args, **kwargs)
