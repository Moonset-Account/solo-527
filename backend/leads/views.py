from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from .models import LeadSource, LeadStatus, Customer, Lead, FollowupRecord, TimeoutRecord
from .serializers import (
    LeadSourceSerializer, LeadStatusSerializer,
    CustomerSerializer, CustomerSimpleSerializer,
    LeadSerializer, LeadDetailSerializer,
    FollowupRecordSerializer, TimeoutRecordSerializer
)
from .filters import LeadFilter
from django.contrib.contenttypes.models import ContentType
from common.models import OperationLog


class LeadSourceViewSet(viewsets.ModelViewSet):
    queryset = LeadSource.objects.all()
    serializer_class = LeadSourceSerializer
    permission_classes = [permissions.IsAuthenticated]


class LeadStatusViewSet(viewsets.ModelViewSet):
    queryset = LeadStatus.objects.all()
    serializer_class = LeadStatusSerializer
    permission_classes = [permissions.IsAuthenticated]


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['name', 'phone', 'email', 'wechat']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'], url_path='simple')
    def simple_list(self, request):
        customers = Customer.objects.all()[:50]
        return Response(CustomerSimpleSerializer(customers, many=True).data)


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.select_related('customer', 'source', 'status', 'assigned_to', 'consultant').all()
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = LeadFilter
    search_fields = ['customer__name', 'customer__phone', 'dental_issues']
    ordering_fields = ['created_at', 'expected_amount', 'quality_score']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return LeadDetailSerializer
        return LeadSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='assign')
    def assign(self, request, pk=None):
        lead = self.get_object()
        user_id = request.data.get('user_id')
        from users.models import User
        try:
            user = User.objects.get(id=user_id)
            old_user = lead.assigned_to
            lead.assigned_to = user
            lead.is_public_sea = False
            lead.save()
            OperationLog.objects.create(
                user=request.user,
                action='assign',
                content_type=ContentType.objects.get_for_model(Lead),
                object_id=lead.id,
                description=f'分配线索：从 {old_user} 分配给 {user}'
            )
            return Response({'status': 'success'})
        except User.DoesNotExist:
            return Response({'detail': '用户不存在'}, status=400)

    @action(detail=True, methods=['post'], url_path='change-status')
    def change_status(self, request, pk=None):
        lead = self.get_object()
        status_id = request.data.get('status_id')
        try:
            new_status = LeadStatus.objects.get(id=status_id)
            old_status = lead.status
            lead.status = new_status
            lead.response_node = new_status.name
            lead.save()
            OperationLog.objects.create(
                user=request.user,
                action='status_change',
                content_type=ContentType.objects.get_for_model(Lead),
                object_id=lead.id,
                description=f'状态变更：{old_status} -> {new_status}'
            )
            return Response({'status': 'success'})
        except LeadStatus.DoesNotExist:
            return Response({'detail': '状态不存在'}, status=400)

    @action(detail=True, methods=['post'], url_path='to-public-sea')
    def to_public_sea(self, request, pk=None):
        lead = self.get_object()
        lead.is_public_sea = True
        lead.assigned_to = None
        lead.save()
        OperationLog.objects.create(
            user=request.user,
            action='status_change',
            content_type=ContentType.objects.get_for_model(Lead),
            object_id=lead.id,
            description='线索进入公海'
        )
        return Response({'status': 'success'})

    @action(detail=True, methods=['post'], url_path='claim')
    def claim(self, request, pk=None):
        lead = self.get_object()
        if not lead.is_public_sea:
            return Response({'detail': '该线索不在公海中'}, status=400)
        lead.is_public_sea = False
        lead.assigned_to = request.user
        lead.save()
        OperationLog.objects.create(
            user=request.user,
            action='assign',
            content_type=ContentType.objects.get_for_model(Lead),
            object_id=lead.id,
            description='领取公海线索'
        )
        return Response({'status': 'success'})

    @action(detail=False, methods=['get'], url_path='public-sea')
    def public_sea(self, request):
        leads = self.filter_queryset(self.get_queryset()).filter(is_public_sea=True)
        page = self.paginate_queryset(leads)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(leads, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='my-leads')
    def my_leads(self, request):
        leads = self.filter_queryset(self.get_queryset()).filter(assigned_to=request.user)
        page = self.paginate_queryset(leads)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(leads, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='timeout')
    def timeout_leads(self, request):
        leads = self.filter_queryset(self.get_queryset()).filter(is_timeout=True)
        page = self.paginate_queryset(leads)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(leads, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='record-timeout-reason')
    def record_timeout_reason(self, request, pk=None):
        lead = self.get_object()
        reason = request.data.get('reason', '')
        lead.timeout_reason = reason
        lead.save()
        return Response({'status': 'success'})


class FollowupRecordViewSet(viewsets.ModelViewSet):
    queryset = FollowupRecord.objects.select_related('lead', 'created_by').all()
    serializer_class = FollowupRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['lead', 'followup_type', 'result', 'created_by']
    ordering_fields = ['created_at']
    ordering = ['-created_at']


class TimeoutRecordViewSet(viewsets.ModelViewSet):
    queryset = TimeoutRecord.objects.select_related('lead', 'responsible_person', 'handled_by').all()
    serializer_class = TimeoutRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['timeout_type', 'is_handled', 'responsible_person']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    @action(detail=True, methods=['post'], url_path='handle')
    def handle(self, request, pk=None):
        record = self.get_object()
        record.is_handled = True
        record.handled_by = request.user
        record.handled_at = timezone.now()
        record.reason = request.data.get('reason', record.reason)
        record.save()
        return Response({'status': 'success'})
