from django.db.models import Count
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import NotificationRule, Notification
from .serializers import NotificationRuleSerializer, NotificationSerializer
from apps.viewsets import OrganizationScopedViewSet
from apps.permissions import IsAdmin


class NotificationRuleViewSet(OrganizationScopedViewSet):
    queryset = NotificationRule.objects.all()
    serializer_class = NotificationRuleSerializer
    filterset_fields = ['trigger', 'method', 'is_active', 'is_enabled']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    action_permission_classes = {
        'create': [IsAuthenticated, IsAdmin],
        'update': [IsAuthenticated, IsAdmin],
        'partial_update': [IsAuthenticated, IsAdmin],
        'destroy': [IsAuthenticated, IsAdmin],
    }

    def get_queryset(self):
        qs = super().get_queryset().annotate(recipient_count=Count('recipients'))
        return qs


class NotificationViewSet(OrganizationScopedViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    filterset_fields = ['notification_type', 'status', 'related_type']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'read_at']

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_admin:
            qs = qs.filter(recipient=self.request.user)
        return qs

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = self.get_queryset().filter(
            recipient=request.user,
            status=Notification.STATUS_UNREAD
        ).count()
        return Response({'count': count})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().filter(
            recipient=request.user,
            status=Notification.STATUS_UNREAD
        ).update(status=Notification.STATUS_READ, read_at=timezone.now())
        return Response({'message': '已标记全部已读'})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.status = Notification.STATUS_READ
        notification.read_at = timezone.now()
        notification.save()
        return Response(NotificationSerializer(notification).data)
