from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from .models import Member, MemberLevel, PointsRecord, ArrivalNotification
from .serializers import (
    MemberSerializer, MemberCreateSerializer, MemberLevelSerializer,
    PointsRecordSerializer, PointsAdjustSerializer,
    ArrivalNotificationSerializer, MemberBaseSerializer
)
from apps.core.permissions import IsAdminOrManager, MemberPrivacyPermission


class MemberLevelViewSet(viewsets.ModelViewSet):
    queryset = MemberLevel.objects.filter(is_active=True)
    serializer_class = MemberLevelSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrManager()]


class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.filter(is_active=True)
    permission_classes = [MemberPrivacyPermission]
    filterset_fields = ['status', 'level']
    search_fields = ['member_no', 'name', 'phone']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return MemberCreateSerializer
        return MemberSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        keyword = self.request.query_params.get('keyword')
        if keyword:
            queryset = queryset.filter(
                Q(member_no__icontains=keyword) |
                Q(name__icontains=keyword) |
                Q(phone__icontains=keyword)
            )
        return queryset
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        member = serializer.save()
        return Response(MemberSerializer(member, context={'request': request}).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], serializer_class=PointsAdjustSerializer)
    def adjust_points(self, request, pk=None):
        if not request.user.is_manager:
            return Response({'error': '无权限操作'}, status=403)
        
        member = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        with transaction.atomic():
            points_change = data['points'] if data['type'] == 'earn' else -data['points']
            new_balance = member.available_points + points_change
            
            if new_balance < 0:
                return Response({'error': '积分不足'}, status=400)
            
            PointsRecord.objects.create(
                member=member,
                type=data['type'],
                points=points_change,
                balance_after=new_balance,
                source=data.get('source', '人工调整'),
                remark=data.get('remark', ''),
                created_by=request.user
            )
            
            member.available_points = new_balance
            if points_change > 0:
                member.total_points += points_change
            member.save()
        
        return Response({
            'message': '积分调整成功',
            'available_points': member.available_points
        })
    
    @action(detail=True, methods=['get'])
    def points_history(self, request, pk=None):
        member = self.get_object()
        records = PointsRecord.objects.filter(member=member).order_by('-created_at')[:50]
        serializer = PointsRecordSerializer(records, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search_by_phone(self, request):
        phone = request.query_params.get('phone', '')
        if not phone:
            return Response({'error': '请输入手机号'}, status=400)
        try:
            member = Member.objects.get(phone=phone, is_active=True)
            return Response(MemberBaseSerializer(member).data)
        except Member.DoesNotExist:
            return Response({'error': '会员不存在'}, status=404)


class ArrivalNotificationViewSet(viewsets.ModelViewSet):
    queryset = ArrivalNotification.objects.all()
    serializer_class = ArrivalNotificationSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrManager()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        member_id = self.request.query_params.get('member_id')
        if member_id:
            queryset = queryset.filter(member_id=member_id)
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        return queryset
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        notification = serializer.save(member_id=request.data.get('member_id'))
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def mark_notified(self, request, pk=None):
        if not request.user.is_manager:
            return Response({'error': '无权限操作'}, status=403)
        notification = self.get_object()
        notification.status = 'notified'
        notification.notified_at = timezone.now()
        notification.save()
        return Response({'message': '已标记为已通知'})
