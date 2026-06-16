from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q, Count

from .models import Notification, UserNotification, Announcement, NotificationType
from .serializers import (
    NotificationSerializer, UserNotificationSerializer,
    AnnouncementSerializer, AnnouncementCreateSerializer,
)
from apps.users.models import User, Role
from apps.audit.utils import log_audit
from apps.audit.models import OperationType


class NotificationPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if view.action in ['list', 'retrieve', 'unread_count', 'mark_read', 'mark_all_read']:
            return True
        return request.user.role in [Role.ADMIN, Role.DORM_MANAGER]


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [NotificationPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['type', 'is_published', 'priority']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role not in [Role.ADMIN, Role.DORM_MANAGER]:
            qs = qs.filter(is_published=True)
        return qs.filter(Q(user_notifications__user=self.request.user) | Q(type=NotificationType.ANNOUNCEMENT)).distinct()

    def perform_create(self, serializer):
        with transaction.atomic():
            notification = serializer.save(sender=self.request.user)
            log_audit(
                self.request.user, OperationType.NOTIFY, '消息通知',
                f'发送通知: {notification.title}',
                new_data={'id': notification.id, 'title': notification.title},
                content_object=notification
            )

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = UserNotification.objects.filter(
            user=request.user, is_read=False
        ).count()
        return Response({'unread_count': count})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        try:
            un = UserNotification.objects.get(notification_id=pk, user=request.user)
            un.is_read = True
            un.read_at = timezone.now()
            un.save()
            return Response({'detail': '已标记为已读'})
        except UserNotification.DoesNotExist:
            return Response({'detail': '通知不存在'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        UserNotification.objects.filter(user=request.user, is_read=False).update(
            is_read=True, read_at=timezone.now()
        )
        return Response({'detail': '全部标记为已读'})

    @action(detail=True, methods=['post'])
    def push(self, request, pk=None):
        if request.user.role not in [Role.ADMIN, Role.DORM_MANAGER]:
            return Response({'detail': '无权限'}, status=status.HTTP_403_FORBIDDEN)
        notification = self.get_object()
        user_ids = request.data.get('user_ids', [])
        target_roles = request.data.get('target_roles', [])
        target_buildings = request.data.get('target_buildings', [])

        users = User.objects.filter(is_active=True)
        if user_ids:
            users = users.filter(id__in=user_ids)
        if target_roles:
            users = users.filter(role__in=target_roles)
        if target_buildings:
            users = users.filter(dorm_building__in=target_buildings)

        created = 0
        with transaction.atomic():
            for user in users:
                _, created_flag = UserNotification.objects.get_or_create(
                    notification=notification, user=user
                )
                if created_flag:
                    created += 1
        return Response({'detail': f'推送完成，共 {created} 人收到'})


class UserNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['is_read']
    ordering_fields = ['notification__created_at']

    def get_queryset(self):
        return UserNotification.objects.filter(user=self.request.user)


class AnnouncementPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if view.action in ['list', 'retrieve']:
            return True
        return request.user.role in [Role.ADMIN, Role.DORM_MANAGER]


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.filter(is_published=True)
    serializer_class = AnnouncementSerializer
    permission_classes = [AnnouncementPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_top', 'is_published']
    search_fields = ['title', 'content']
    ordering_fields = ['-is_top', '-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return AnnouncementCreateSerializer
        return AnnouncementSerializer

    def get_queryset(self):
        qs = Announcement.objects.all()
        user = self.request.user
        if user.role not in [Role.ADMIN, Role.DORM_MANAGER]:
            qs = qs.filter(is_published=True)
            qs = qs.filter(
                Q(target_roles=[]) | Q(target_roles__contains=[user.role])
            )
            if user.dorm_building:
                qs = qs.filter(
                    Q(target_buildings=[]) | Q(target_buildings__contains=[user.dorm_building])
                )
        now = timezone.now()
        qs = qs.filter(Q(expires_at__isnull=True) | Q(expires_at__gte=now))
        return qs

    def perform_create(self, serializer):
        with transaction.atomic():
            instance = serializer.save(
                author=self.request.user,
                published_at=timezone.now() if serializer.validated_data.get('is_published') else None
            )
            log_audit(
                self.request.user, OperationType.CREATE, '消息通知',
                f'发布公告: {instance.title}',
                content_object=instance
            )
