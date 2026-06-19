from django.db import models
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Notification
from .serializers import (
    NotificationSerializer, NotificationCreateSerializer,
    NotificationMarkReadSerializer
)
from .services import create_notification, get_unread_count, mark_all_as_read
from common.views import BaseViewSet
from common.permissions import IsRepresentative
from users.models import User


class NotificationViewSet(BaseViewSet):
    queryset = Notification.objects.select_related('user').all()
    serializer_class = NotificationSerializer
    search_fields = ['title', 'content', 'user__first_name']
    filterset_fields = ['type', 'channel', 'is_read', 'user']
    http_method_names = ['get', 'list', 'post', 'patch', 'delete']

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role not in ['admin', 'representative']:
            queryset = queryset.filter(user=self.request.user)
        return queryset

    @action(detail=False, methods=['get'])
    def my_notifications(self, request):
        queryset = self.get_queryset().filter(user=request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unread(self, request):
        queryset = self.get_queryset().filter(user=request.user, is_read=False)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = get_unread_count(request.user)
        return Response({'unread_count': count})

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.mark_as_read()
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        serializer = NotificationMarkReadSerializer(data=request.data)
        if serializer.is_valid():
            ids = serializer.validated_data.get('notification_ids')
            if ids:
                Notification.objects.filter(
                    id__in=ids,
                    user=request.user
                ).update(is_read=True, read_at=timezone.now())
            else:
                mark_all_as_read(request.user)
            return Response({'message': '已标记为已读'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsRepresentative])
    def send_bulk(self, request):
        serializer = NotificationCreateSerializer(data=request.data)
        if serializer.is_valid():
            user_ids = serializer.validated_data['user_ids']
            users = User.objects.filter(id__in=user_ids, is_active=True)

            created = []
            for user in users:
                notification = create_notification(
                    user=user,
                    title=serializer.validated_data['title'],
                    content=serializer.validated_data['content'],
                    type=serializer.validated_data.get('type', 'system'),
                    channel=serializer.validated_data.get('channel', 'in_app'),
                    related_id=serializer.validated_data.get('related_id'),
                    related_type=serializer.validated_data.get('related_type')
                )
                created.append(notification.id)

            return Response({
                'message': f'已发送 {len(created)} 条通知',
                'notification_ids': created
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def test_notification(self, request):
        notification = create_notification(
            user=request.user,
            title='测试通知',
            content='这是一条测试通知。',
            type='system',
            channel='in_app'
        )
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        queryset = self.get_queryset().filter(user=request.user)
        total = queryset.count()
        unread = queryset.filter(is_read=False).count()
        by_type = queryset.values('type').annotate(
            count=models.Count('id'),
            unread=models.Count('id', filter=models.Q(is_read=False))
        )
        return Response({
            'total': total,
            'unread': unread,
            'by_type': list(by_type)
        })
