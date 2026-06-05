from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from common.permissions import IsAdmin, IsAdminOrTeacher, IsAdminOrTeacherOrReadOnly
from common.audit import log_audit
from .models import Notification, NotificationRead
from .serializers import NotificationSerializer, NotificationReadSerializer


class NotificationListView(generics.ListCreateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeacherOrReadOnly]
    filterset_fields = ['target_type', 'is_urgent']
    search_fields = ['title']

    def get_queryset(self):
        from django.db import models
        user = self.request.user
        qs = Notification.objects.select_related('created_by', 'target_class', 'target_user').order_by('-created_at')
        if user.role == 'admin':
            return qs
        if user.role == 'teacher':
            return qs.filter(
                models.Q(target_type='all')
                | models.Q(target_type='class', target_class__teacher=user)
            ).distinct()
        return qs.filter(
            models.Q(target_type='all')
            | models.Q(target_type='class', target_class__children__parent_relations__parent=user)
            | models.Q(target_type='individual', target_user=user)
        ).distinct()

    def perform_create(self, serializer):
        obj = serializer.save(created_by=self.request.user)
        log_audit(self.request.user, 'create', 'Notification', obj.pk)


class NotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


class NotificationMarkReadView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk)
        except Notification.DoesNotExist:
            return Response({'detail': '通知不存在'}, status=status.HTTP_404_NOT_FOUND)
        NotificationRead.objects.get_or_create(notification=notification, user=request.user)
        return Response({'detail': '已标记为已读'})


class NotificationUnreadCountView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db import models
        user = request.user
        read_ids = NotificationRead.objects.filter(user=user).values_list('notification_id', flat=True)
        qs = Notification.objects.all()
        if user.role == 'teacher':
            qs = qs.filter(
                models.Q(target_type='all')
                | models.Q(target_type='class', target_class__teacher=user)
            )
        elif user.role == 'parent':
            qs = qs.filter(
                models.Q(target_type='all')
                | models.Q(target_type='class', target_class__children__parent_relations__parent=user)
                | models.Q(target_type='individual', target_user=user)
            )
        total = qs.count()
        unread = qs.exclude(id__in=read_ids).count()
        return Response({'total': total, 'unread': unread})
