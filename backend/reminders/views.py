from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from .models import Reminder, ReminderConfig
from .serializers import (
    EscalationLogSerializer,
    ReminderConfigSerializer,
    ReminderSerializer,
)


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsAssignedProjectManager(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'admin':
            return True
        if request.user.role == 'project_manager':
            if view.action in ('handle',):
                return True
        return False

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        return obj.assignee == request.user


class ReminderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReminderSerializer
    queryset = Reminder.objects.all()
    filterset_fields = ('assignee_id', 'status', 'priority')

    def get_permissions(self):
        if self.action == 'handle':
            return [IsAuthenticated(), IsAssignedProjectManager()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def handle(self, request, pk=None):
        reminder = self.get_object()

        if reminder.status != Reminder.Status.PENDING:
            return Response(
                {'detail': 'Only pending reminders can be handled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reminder.status = Reminder.Status.HANDLED
        reminder.handled_at = timezone.now()
        reminder.save()

        return Response(ReminderSerializer(reminder).data)

    @action(detail=True, methods=['get'])
    def escalations(self, request, pk=None):
        reminder = self.get_object()
        escalated = Reminder.objects.filter(
            reconciliation=reminder.reconciliation,
            status=Reminder.Status.ESCALATED,
        )
        serializer = EscalationLogSerializer(escalated, many=True)
        return Response(serializer.data)


class ReminderConfigViewSet(viewsets.GenericViewSet):
    serializer_class = ReminderConfigSerializer
    queryset = ReminderConfig.objects.all()

    def get_permissions(self):
        if self.action in ('update', 'partial_update'):
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def retrieve(self, request, pk=None):
        config = ReminderConfig.objects.first()
        if not config:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ReminderConfigSerializer(config)
        return Response(serializer.data)

    def update(self, request, pk=None):
        config = ReminderConfig.objects.first()
        if not config:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ReminderConfigSerializer(config, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def partial_update(self, request, pk=None):
        config = ReminderConfig.objects.first()
        if not config:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ReminderConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
