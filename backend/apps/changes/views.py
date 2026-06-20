from django.db.models import Count
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from .models import ChangeWindow, ChangeLog
from .serializers import (
    ChangeWindowListSerializer, ChangeWindowDetailSerializer,
    ChangeWindowCreateSerializer, ChangeActionSerializer,
    ChangeLogSerializer
)
from .filters import ChangeWindowFilter
from apps.viewsets import OrganizationScopedViewSet


class ChangeWindowViewSet(OrganizationScopedViewSet):
    queryset = ChangeWindow.objects.all()
    filterset_class = ChangeWindowFilter
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['start_time', 'created_at', 'status']

    def get_queryset(self):
        qs = super().get_queryset().annotate(server_count=Count('servers'))
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return ChangeWindowListSerializer
        elif self.action == 'retrieve':
            return ChangeWindowDetailSerializer
        elif self.action == 'create':
            return ChangeWindowCreateSerializer
        return ChangeWindowDetailSerializer

    def perform_create(self, serializer):
        code = f'CH{timezone.now().strftime("%Y%m%d%H%M%S")}'
        super().perform_create(serializer)
        instance = serializer.instance
        instance.code = f'{code}{instance.id:04d}'
        instance.applicant = self.request.user
        instance.save()
        self._create_log(instance, '创建变更', '', instance.status, f'创建变更: {instance.name}')

    def _create_log(self, change, action, old_status, new_status, detail='', is_failure=False, failure_reason=''):
        return ChangeLog.objects.create(
            organization=self.request.user.organization,
            change_window=change,
            action=action,
            old_status=old_status,
            new_status=new_status,
            detail=detail,
            is_failure=is_failure,
            failure_reason=failure_reason,
            operator=self.request.user
        )

    @action(detail=True, methods=['post'], serializer_class=ChangeActionSerializer)
    def approve(self, request, pk=None):
        change = self.get_object()
        if change.status != ChangeWindow.STATUS_PENDING:
            return Response({'error': '只有待审批状态可以审批'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_status = change.status
        change.status = ChangeWindow.STATUS_APPROVED
        change.approver = request.user
        change.approved_at = timezone.now()
        change.save()
        self._create_log(
            change, '审批通过', old_status, change.status,
            serializer.validated_data.get('comment', ''),
            serializer.validated_data.get('is_failure', False),
            serializer.validated_data.get('failure_reason', '')
        )
        return Response(ChangeWindowDetailSerializer(change).data)

    @action(detail=True, methods=['post'], serializer_class=ChangeActionSerializer)
    def reject(self, request, pk=None):
        change = self.get_object()
        if change.status != ChangeWindow.STATUS_PENDING:
            return Response({'error': '只有待审批状态可以拒绝'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_status = change.status
        change.status = ChangeWindow.STATUS_CANCELLED
        change.save()
        self._create_log(
            change, '审批拒绝', old_status, change.status,
            serializer.validated_data.get('comment', ''),
            True,
            serializer.validated_data.get('failure_reason', '审批拒绝')
        )
        return Response(ChangeWindowDetailSerializer(change).data)

    @action(detail=True, methods=['post'], serializer_class=ChangeActionSerializer)
    def start(self, request, pk=None):
        change = self.get_object()
        if change.status != ChangeWindow.STATUS_APPROVED:
            return Response({'error': '只有已批准状态可以开始执行'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_status = change.status
        change.status = ChangeWindow.STATUS_IN_PROGRESS
        change.actual_start = timezone.now()
        if not change.executor:
            change.executor = request.user
        change.save()
        self._create_log(change, '开始执行', old_status, change.status, serializer.validated_data.get('comment', ''))
        return Response(ChangeWindowDetailSerializer(change).data)

    @action(detail=True, methods=['post'], serializer_class=ChangeActionSerializer)
    def complete(self, request, pk=None):
        change = self.get_object()
        if change.status != ChangeWindow.STATUS_IN_PROGRESS:
            return Response({'error': '只有进行中状态可以完成'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_status = change.status
        is_failure = serializer.validated_data.get('is_failure', False)
        change.status = ChangeWindow.STATUS_FAILED if is_failure else ChangeWindow.STATUS_SUCCESS
        change.actual_end = timezone.now()
        change.result_summary = serializer.validated_data.get('comment', '')
        change.save()
        self._create_log(
            change, '执行完成', old_status, change.status,
            serializer.validated_data.get('comment', ''),
            is_failure,
            serializer.validated_data.get('failure_reason', '')
        )
        return Response(ChangeWindowDetailSerializer(change).data)

    @action(detail=True, methods=['post'], serializer_class=ChangeActionSerializer)
    def cancel(self, request, pk=None):
        change = self.get_object()
        if change.status in [ChangeWindow.STATUS_SUCCESS, ChangeWindow.STATUS_CANCELLED]:
            return Response({'error': '当前状态不可以取消'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_status = change.status
        change.status = ChangeWindow.STATUS_CANCELLED
        change.save()
        self._create_log(change, '取消变更', old_status, change.status, serializer.validated_data.get('comment', ''))
        return Response(ChangeWindowDetailSerializer(change).data)


class ChangeLogViewSet(OrganizationScopedViewSet):
    queryset = ChangeLog.objects.all()
    serializer_class = ChangeLogSerializer
    filterset_fields = ['change_window', 'action', 'is_failure', 'operator']
    search_fields = ['detail', 'failure_reason']
    ordering_fields = ['operated_at']
