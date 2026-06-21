from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.contenttypes.models import ContentType
from datetime import date
from .models import (
    ApprovalLevel, ApprovalFlow, FlowLevelRelation, ApprovalRequest, ApprovalRecord
)
from .serializers import (
    ApprovalLevelSerializer, ApprovalFlowSerializer,
    FlowLevelRelationSerializer, ApprovalRequestSerializer, ApprovalRecordSerializer
)


class ApprovalLevelViewSet(viewsets.ModelViewSet):
    queryset = ApprovalLevel.objects.all()
    serializer_class = ApprovalLevelSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    ordering = ['level_order']


class ApprovalFlowViewSet(viewsets.ModelViewSet):
    queryset = ApprovalFlow.objects.all()
    serializer_class = ApprovalFlowSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['flow_type', 'is_active']


class FlowLevelRelationViewSet(viewsets.ModelViewSet):
    queryset = FlowLevelRelation.objects.select_related('flow', 'level').prefetch_related('required_approvers')
    serializer_class = FlowLevelRelationSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_fields = ['flow', 'level']


class ApprovalRequestViewSet(viewsets.ModelViewSet):
    queryset = ApprovalRequest.objects.select_related(
        'requester', 'content_type'
    ).prefetch_related('records', 'records__approver', 'records__level')
    serializer_class = ApprovalRequestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['flow_type', 'status', 'requester', 'current_level_order']
    search_fields = ['title', 'remarks']
    ordering_fields = ['created_at']

    def perform_create(self, serializer):
        serializer.save(requester=self.request.user, status='pending', current_level_order=1)

    @action(detail=False, methods=['get'])
    def my_pending(self, request):
        user = request.user
        pending_requests = ApprovalRequest.objects.filter(
            status__in=['pending', 'in_progress']
        )
        my_pending = []
        for req in pending_requests:
            try:
                flow = ApprovalFlow.objects.get(flow_type=req.flow_type, is_active=True)
                relation = FlowLevelRelation.objects.get(flow=flow, order=req.current_level_order)
                if user in relation.required_approvers.all():
                    my_pending.append(req)
            except (ApprovalFlow.DoesNotExist, FlowLevelRelation.DoesNotExist):
                continue
        serializer = self.get_serializer(my_pending, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_submitted(self, request):
        qs = self.get_queryset().filter(requester=request.user)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        approval_request = self.get_object()
        comment = request.data.get('comment', '')
        try:
            flow = ApprovalFlow.objects.get(flow_type=approval_request.flow_type, is_active=True)
            relation = FlowLevelRelation.objects.get(flow=flow, order=approval_request.current_level_order)
            if request.user not in relation.required_approvers.all():
                return Response({'error': '您没有权限审批此申请'}, status=status.HTTP_403_FORBIDDEN)
            ApprovalRecord.objects.create(
                request=approval_request,
                level=relation.level,
                approver=request.user,
                action='approve',
                comment=comment
            )
            max_order = FlowLevelRelation.objects.filter(flow=flow).aggregate(max_order=models.Max('order'))['max_order']
            if approval_request.current_level_order >= max_order:
                approval_request.status = 'approved'
            else:
                approval_request.current_level_order += 1
                approval_request.status = 'in_progress'
            approval_request.save()
            return Response(self.get_serializer(approval_request).data)
        except (ApprovalFlow.DoesNotExist, FlowLevelRelation.DoesNotExist):
            return Response({'error': '审批流程配置错误'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        approval_request = self.get_object()
        comment = request.data.get('comment', '')
        try:
            flow = ApprovalFlow.objects.get(flow_type=approval_request.flow_type, is_active=True)
            relation = FlowLevelRelation.objects.get(flow=flow, order=approval_request.current_level_order)
            if request.user not in relation.required_approvers.all():
                return Response({'error': '您没有权限审批此申请'}, status=status.HTTP_403_FORBIDDEN)
            ApprovalRecord.objects.create(
                request=approval_request,
                level=relation.level,
                approver=request.user,
                action='reject',
                comment=comment
            )
            approval_request.status = 'rejected'
            approval_request.save()
            return Response(self.get_serializer(approval_request).data)
        except (ApprovalFlow.DoesNotExist, FlowLevelRelation.DoesNotExist):
            return Response({'error': '审批流程配置错误'}, status=status.HTTP_400_BAD_REQUEST)


class ApprovalRecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ApprovalRecord.objects.select_related('request', 'level', 'approver', 'transferred_to')
    serializer_class = ApprovalRecordSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['request', 'level', 'approver']
