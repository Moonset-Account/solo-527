from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Q, Exists, OuterRef
from .models import Notification, NotificationRead, NotificationAttachment, Message
from .serializers import (
    NotificationSerializer, NotificationReadSerializer,
    NotificationAttachmentSerializer, MessageSerializer
)
from core.permissions import IsTeacherOrDirector, IsParent
from apps.children.models import Child


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.filter(is_deleted=False)
    serializer_class = NotificationSerializer
    permission_classes = [IsTeacherOrDirector | IsParent]
    filterset_fields = ['type', 'status', 'target_type', 'published_by']
    search_fields = ['title', 'content']
    ordering_fields = ['published_at', 'created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        if user.role == 'parent':
            children = Child.objects.filter(parents=user).values_list('id', flat=True)
            class_ids = Child.objects.filter(parents=user).values_list('child_class_id', flat=True)
            qs = qs.filter(
                Q(target_type='all') |
                Q(target_type='user', target_users=user) |
                Q(target_type='class', target_classes__in=class_ids) |
                Q(target_type='child', target_children__in=children)
            ).distinct()
        elif user.role == 'teacher':
            class_ids = user.teacher_profile.classes.values_list('id', flat=True)
            qs = qs.filter(
                Q(target_type='all') |
                Q(target_type='user', target_users=user) |
                Q(target_type='class', target_classes__in=class_ids)
            ).distinct()

        read_subquery = NotificationRead.objects.filter(
            notification=OuterRef('pk'),
            user=user
        )
        qs = qs.annotate(
            read_count=Count('reads'),
            is_read=Exists(read_subquery),
            is_ack=Exists(read_subquery.filter(ack_at__isnull=False))
        )
        return qs

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'publish']:
            return [IsTeacherOrDirector()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        notification = self.get_object()
        if notification.status != 'draft':
            return Response({'error': '只能发布草稿状态的通知'}, status=status.HTTP_400_BAD_REQUEST)
        notification.status = 'published'
        notification.published_at = timezone.now()
        notification.published_by = request.user
        notification.updated_by = request.user
        notification.save()
        return Response(NotificationSerializer(notification, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        read_obj, created = NotificationRead.objects.get_or_create(
            notification=notification,
            user=request.user,
            defaults={'created_by': request.user}
        )
        if not read_obj.read_at:
            read_obj.read_at = timezone.now()
            read_obj.save()
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def mark_ack(self, request, pk=None):
        notification = self.get_object()
        if not notification.need_ack:
            return Response({'error': '此通知不需要确认'}, status=status.HTTP_400_BAD_REQUEST)
        read_obj, created = NotificationRead.objects.get_or_create(
            notification=notification,
            user=request.user,
            defaults={'created_by': request.user, 'read_at': timezone.now()}
        )
        read_obj.ack_at = timezone.now()
        read_obj.save()
        return Response({'status': 'success'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        user = request.user
        read_notifications = NotificationRead.objects.filter(
            user=user,
            notification=OuterRef('pk')
        )
        count = self.get_queryset().filter(
            status='published'
        ).exclude(
            Exists(read_notifications)
        ).count()
        return Response({'unread_count': count})


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.filter(is_deleted=False)
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['sender', 'receiver', 'type', 'is_read', 'related_child']
    search_fields = ['content']
    ordering_fields = ['created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        return qs.filter(Q(sender=user) | Q(receiver=user)).distinct()

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user, created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def conversations(self, request):
        user = request.user
        messages = self.get_queryset().order_by('-created_at')
        conversation_users = {}
        for msg in messages:
            other_user = msg.receiver if msg.sender == user else msg.sender
            if other_user.id not in conversation_users:
                conversation_users[other_user.id] = {
                    'user': {
                        'id': other_user.id,
                        'name': other_user.name,
                        'avatar': other_user.avatar.url if other_user.avatar else None,
                        'role': other_user.role
                    },
                    'last_message': MessageSerializer(msg).data,
                    'unread_count': 0
                }
            if msg.receiver == user and not msg.is_read:
                conversation_users[other_user.id]['unread_count'] += 1
        return Response(list(conversation_users.values()))

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        message = self.get_object()
        if message.receiver == request.user and not message.is_read:
            message.is_read = True
            message.read_at = timezone.now()
            message.save()
        return Response({'status': 'success'})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': '缺少user_id参数'}, status=status.HTTP_400_BAD_REQUEST)
        Message.objects.filter(
            sender_id=user_id,
            receiver=request.user,
            is_read=False
        ).update(is_read=True, read_at=timezone.now())
        return Response({'status': 'success'})
