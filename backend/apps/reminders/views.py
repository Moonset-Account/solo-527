from datetime import datetime

from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.reminders.models import Reminder, ReminderRule
from apps.reminders.serializers import (
    ReminderHandleSerializer,
    ReminderRuleSerializer,
    ReminderSerializer,
)


class CanManageReminders(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if view.action in ['list', 'retrieve', 'handle', 'stats']:
            return request.user.role in ['super_admin', 'host', 'operator', 'receptionist']
        return request.user.role in ['super_admin', 'host']

    def has_object_permission(self, request, view, obj):
        if request.user.role in ['super_admin', 'host', 'operator']:
            return True
        return request.method in ['GET', 'PATCH']


class ReminderRuleViewSet(viewsets.ModelViewSet):
    queryset = ReminderRule.objects.all()
    serializer_class = ReminderRuleSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageReminders]
    filterset_fields = ['trigger_type', 'level', 'is_active']

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        rule = self.get_object()
        rule.is_active = True
        rule.save()
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        rule = self.get_object()
        rule.is_active = False
        rule.save()
        return Response({'status': 'success'})


class ReminderViewSet(viewsets.ModelViewSet):
    queryset = Reminder.objects.select_related('rule', 'handled_by')
    serializer_class = ReminderSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageReminders]
    filterset_fields = ['status', 'level', 'related_type', 'rule']
    ordering_fields = ['level', 'created_at', 'time_limit']

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        level = self.request.query_params.get('level')
        pending = self.request.query_params.get('pending')

        if pending == 'true':
            queryset = queryset.filter(status='pending').order_by('level', 'time_limit')
        if status:
            queryset = queryset.filter(status=status)
        if level:
            queryset = queryset.filter(level=level)

        return queryset

    @action(detail=True, methods=['post'])
    def handle(self, request, pk=None):
        reminder = self.get_object()
        serializer = ReminderHandleSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        reminder.status = data['status']
        reminder.handle_notes = data.get('notes', '')
        reminder.handled_by = request.user
        reminder.handled_at = timezone.now()
        reminder.save()

        return Response(ReminderSerializer(reminder).data)

    @action(detail=True, methods=['post'])
    def escalate(self, request, pk=None):
        reminder = self.get_object()
        if reminder.level > 1 and not reminder.escalated:
            reminder.original_level = reminder.level
            reminder.level = reminder.level - 1
            reminder.escalated = True
            reminder.time_limit = timezone.now()
            reminder.save()
            return Response(ReminderSerializer(reminder).data)
        return Response(
            {'error': '无法升级此提醒'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        pending_reminders = Reminder.objects.filter(status='pending')
        overdue_reminders = [r for r in pending_reminders if r.is_overdue]

        stats = {
            'total_pending': pending_reminders.count(),
            'total_overdue': len(overdue_reminders),
            'by_level': {},
        }

        for level in [1, 2, 3, 4]:
            level_pending = pending_reminders.filter(level=level).count()
            level_overdue = len([r for r in overdue_reminders if r.level == level])
            stats['by_level'][level] = {
                'pending': level_pending,
                'overdue': level_overdue,
            }

        return Response(stats)

    @action(detail=False, methods=['post'])
    def batch_handle(self, request):
        ids = request.data.get('ids', [])
        status = request.data.get('status', 'resolved')
        notes = request.data.get('notes', '')

        if not ids:
            return Response(
                {'error': '请选择要处理的提醒'},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated = Reminder.objects.filter(id__in=ids, status='pending').update(
            status=status,
            handle_notes=notes,
            handled_by=request.user,
            handled_at=timezone.now()
        )

        return Response({'updated': updated})
