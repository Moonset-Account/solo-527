from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Alert, AlertRecord, AlertAttachment, AlertHistory
from .serializers import (
    AlertListSerializer, AlertDetailSerializer, AlertCreateSerializer,
    AlertUpdateSerializer, AlertActionSerializer,
    AlertRecordSerializer, AlertAttachmentSerializer
)
from .filters import AlertFilter
from apps.viewsets import OrganizationScopedViewSet
from apps.permissions import IsAdminOrSecurityOwner


class AlertViewSet(OrganizationScopedViewSet):
    queryset = Alert.objects.all()
    filterset_class = AlertFilter
    search_fields = ['code', 'title', 'content', 'metric']
    ordering_fields = ['occurred_at', 'created_at', 'level', 'status']
    action_permission_classes = {
        'acknowledge': [IsAuthenticated, IsAdminOrSecurityOwner],
        'start_process': [IsAuthenticated, IsAdminOrSecurityOwner],
        'close': [IsAuthenticated, IsAdminOrSecurityOwner],
    }

    def get_serializer_class(self):
        if self.action == 'list':
            return AlertListSerializer
        elif self.action == 'retrieve':
            return AlertDetailSerializer
        elif self.action == 'create':
            return AlertCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AlertUpdateSerializer
        return AlertDetailSerializer

    def perform_create(self, serializer):
        code = f'AL{timezone.now().strftime("%Y%m%d%H%M%S")}'
        super().perform_create(serializer)
        instance = serializer.instance
        instance.code = f'{code}{instance.id:04d}'
        instance.save()
        self._create_history(instance, ['status'], {'status': ''}, {'status': instance.status})

    def perform_update(self, serializer):
        instance = self.get_object()
        old_data = {f: getattr(instance, f) for f in ['title', 'content', 'level', 'handler']}
        super().perform_update(serializer)
        instance = serializer.instance
        new_data = {f: getattr(instance, f) for f in ['title', 'content', 'level', 'handler']}
        changed_fields = [f for f in old_data if old_data[f] != new_data[f]]
        if changed_fields:
            self._create_history(instance, changed_fields, old_data, new_data)

    def _create_history(self, alert, fields, old_data, new_data):
        histories = []
        for field in fields:
            old_val = str(old_data.get(field, '')) if old_data.get(field) else ''
            new_val = str(new_data.get(field, '')) if new_data.get(field) else ''
            if old_val != new_val:
                histories.append(AlertHistory(
                    organization=self.request.user.organization,
                    alert=alert,
                    field=field,
                    old_value=old_val,
                    new_value=new_val,
                    changed_by=self.request.user
                ))
        if histories:
            AlertHistory.objects.bulk_create(histories)

    def _create_record(self, alert, action, old_status, new_status, comment=''):
        return AlertRecord.objects.create(
            organization=self.request.user.organization,
            alert=alert,
            action=action,
            old_status=old_status,
            new_status=new_status,
            comment=comment,
            processed_by=self.request.user
        )

    @action(detail=True, methods=['post'], serializer_class=AlertActionSerializer)
    def acknowledge(self, request, pk=None):
        alert = self.get_object()
        if alert.status != Alert.STATUS_PENDING:
            return Response({'error': '只有待处理状态的告警可以确认'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_status = alert.status
        alert.status = Alert.STATUS_ACKNOWLEDGED
        alert.acknowledged_at = timezone.now()
        alert.acknowledged_by = request.user
        alert.save()
        self._create_record(alert, '确认告警', old_status, alert.status, serializer.validated_data.get('comment', ''))
        self._create_history(alert, ['status', 'acknowledged_by'],
                            {'status': old_status, 'acknowledged_by': ''},
                            {'status': alert.status, 'acknowledged_by': request.user.id})
        return Response(AlertDetailSerializer(alert).data)

    @action(detail=True, methods=['post'], serializer_class=AlertActionSerializer)
    def start_process(self, request, pk=None):
        alert = self.get_object()
        if alert.status not in [Alert.STATUS_PENDING, Alert.STATUS_ACKNOWLEDGED]:
            return Response({'error': '当前状态不可以开始处理'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_status = alert.status
        alert.status = Alert.STATUS_PROCESSING
        if serializer.validated_data.get('handler'):
            alert.handler_id = serializer.validated_data['handler']
        elif not alert.handler:
            alert.handler = request.user
        alert.save()
        self._create_record(alert, '开始处理', old_status, alert.status, serializer.validated_data.get('comment', ''))
        return Response(AlertDetailSerializer(alert).data)

    @action(detail=True, methods=['post'], serializer_class=AlertActionSerializer)
    def close(self, request, pk=None):
        alert = self.get_object()
        if alert.status == Alert.STATUS_CLOSED:
            return Response({'error': '告警已经关闭'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_status = alert.status
        alert.status = Alert.STATUS_CLOSED
        alert.closed_at = timezone.now()
        alert.closed_by = request.user
        if not alert.processed_at:
            alert.processed_at = timezone.now()
            alert.processed_by = request.user
        alert.save()
        self._create_record(alert, '关闭告警', old_status, alert.status, serializer.validated_data.get('comment', ''))
        return Response(AlertDetailSerializer(alert).data)

    @action(detail=True, methods=['post'], serializer_class=AlertActionSerializer)
    def add_comment(self, request, pk=None):
        alert = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self._create_record(alert, '添加备注', '', '', serializer.validated_data.get('comment', ''))
        return Response(AlertDetailSerializer(alert).data)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_attachment(self, request, pk=None):
        alert = self.get_object()
        file = request.FILES.get('file')
        if not file:
            return Response({'error': '请上传文件'}, status=status.HTTP_400_BAD_REQUEST)
        attachment = AlertAttachment.objects.create(
            organization=request.user.organization,
            alert=alert,
            file=file,
            file_name=file.name,
            file_size=file.size,
            content_type=file.content_type,
            created_by=request.user,
            updated_by=request.user
        )
        return Response(AlertAttachmentSerializer(attachment).data, status=status.HTTP_201_CREATED)


class AlertRecordViewSet(OrganizationScopedViewSet):
    queryset = AlertRecord.objects.all()
    serializer_class = AlertRecordSerializer
    filterset_fields = ['alert', 'action']
    search_fields = ['comment']
    ordering_fields = ['processed_at']


class AlertAttachmentViewSet(OrganizationScopedViewSet):
    queryset = AlertAttachment.objects.all()
    serializer_class = AlertAttachmentSerializer
    filterset_fields = ['alert']
    search_fields = ['file_name']
    ordering_fields = ['created_at', 'file_size']
