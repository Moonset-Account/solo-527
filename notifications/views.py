from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import SMSMessage, Notification
from .serializers import SMSMessageSerializer, NotificationSerializer
from .services import SMSService, NotificationService
from core.permissions import IsAdminOrNurse


class SMSMessageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SMSMessage.objects.all()
    serializer_class = SMSMessageSerializer

    def get_permissions(self):
        return [IsAdminOrNurse()]

    def get_queryset(self):
        qs = super().get_queryset()
        patient = self.request.query_params.get('patient')
        status_filter = self.request.query_params.get('status')
        message_type = self.request.query_params.get('message_type')
        if patient:
            qs = qs.filter(patient_id=patient)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if message_type:
            qs = qs.filter(message_type=message_type)
        return qs.order_by('-created_at')

    @action(detail=False, methods=['post'], url_path='send-bulk-reminders')
    def send_bulk_reminders(self, request):
        if request.user.role not in ['ADMIN', 'NURSE']:
            return Response(status=status.HTTP_403_FORBIDDEN)
        count = SMSService.send_bulk_reminders()
        return Response({
            'status': 'success',
            'message': f'已发送 {count} 条提醒短信'
        })


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset().filter(user=user)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs.order_by('-created_at')

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = NotificationService.get_unread_count(request.user)
        return Response({'unread_count': count})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        count = NotificationService.mark_all_read(request.user)
        return Response({'status': 'success', 'marked_count': count})

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        if notification.user != request.user:
            return Response(status=status.HTTP_403_FORBIDDEN)
        notification.mark_read()
        return Response({'status': 'success'})
