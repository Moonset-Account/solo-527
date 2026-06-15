from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Sum
from django.utils import timezone
from .models import ContractStatus, Contract, ContractItem, ContractAttachment, ApprovalRecord, PaymentRecord
from .serializers import (
    ContractStatusSerializer, ContractSerializer, ContractDetailSerializer,
    ContractItemSerializer, ContractAttachmentSerializer,
    ApprovalRecordSerializer, PaymentRecordSerializer
)
from .filters import ContractFilter
from common.models import OperationLog
from django.contrib.contenttypes.models import ContentType


class ContractStatusViewSet(viewsets.ModelViewSet):
    queryset = ContractStatus.objects.all()
    serializer_class = ContractStatusSerializer
    permission_classes = [permissions.IsAuthenticated]


class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.select_related('customer', 'status', 'sales_person', 'doctor', 'created_by', 'approved_by').all()
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = ContractFilter
    search_fields = ['contract_no', 'customer__name', 'customer__phone']
    ordering_fields = ['created_at', 'total_amount', 'actual_amount']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ContractDetailSerializer
        return ContractSerializer

    @action(detail=True, methods=['post'], url_path='submit-approval')
    def submit_approval(self, request, pk=None):
        contract = self.get_object()
        if contract.approval_status in ['approved', 'pending']:
            return Response({'detail': '合同已在审批流程中'}, status=400)

        contract.approval_status = 'pending'
        contract.save()

        ApprovalRecord.objects.create(
            contract=contract,
            action='submit',
            comments=request.data.get('comments', ''),
            approved_by=request.user
        )

        OperationLog.objects.create(
            user=request.user,
            action='approval',
            content_type=ContentType.objects.get_for_model(Contract),
            object_id=contract.id,
            description=f'提交合同审批: {contract.contract_no}'
        )

        return Response({'status': 'success'})

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        contract = self.get_object()
        if contract.approval_status != 'pending':
            return Response({'detail': '合同不在待审批状态'}, status=400)

        contract.approval_status = 'approved'
        contract.approved_by = request.user
        contract.approved_at = timezone.now()
        contract.approval_comments = request.data.get('comments', '')
        contract.save()

        ApprovalRecord.objects.create(
            contract=contract,
            action='approve',
            comments=request.data.get('comments', ''),
            approved_by=request.user
        )

        OperationLog.objects.create(
            user=request.user,
            action='approval',
            content_type=ContentType.objects.get_for_model(Contract),
            object_id=contract.id,
            description=f'批准合同: {contract.contract_no}'
        )

        return Response({'status': 'success'})

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        contract = self.get_object()
        if contract.approval_status != 'pending':
            return Response({'detail': '合同不在待审批状态'}, status=400)

        contract.approval_status = 'rejected'
        contract.approved_by = request.user
        contract.approval_comments = request.data.get('comments', '')
        contract.save()

        ApprovalRecord.objects.create(
            contract=contract,
            action='reject',
            comments=request.data.get('comments', ''),
            approved_by=request.user
        )

        OperationLog.objects.create(
            user=request.user,
            action='approval',
            content_type=ContentType.objects.get_for_model(Contract),
            object_id=contract.id,
            description=f'拒绝合同: {contract.contract_no}'
        )

        return Response({'status': 'success'})

    @action(detail=True, methods=['post'], url_path='request-revision')
    def request_revision(self, request, pk=None):
        contract = self.get_object()
        if contract.approval_status != 'pending':
            return Response({'detail': '合同不在待审批状态'}, status=400)

        contract.approval_status = 'revision'
        contract.approval_comments = request.data.get('comments', '')
        contract.save()

        ApprovalRecord.objects.create(
            contract=contract,
            action='revision',
            comments=request.data.get('comments', ''),
            approved_by=request.user
        )

        return Response({'status': 'success'})

    @action(detail=True, methods=['post'], url_path='add-item')
    def add_item(self, request, pk=None):
        contract = self.get_object()
        item_data = {
            'contract': contract.id,
            'item_name': request.data.get('item_name'),
            'category': request.data.get('category', ''),
            'quantity': request.data.get('quantity', 1),
            'unit_price': request.data.get('unit_price', 0),
            'discount': request.data.get('discount', 0),
            'notes': request.data.get('notes', '')
        }
        serializer = ContractItemSerializer(data=item_data)
        if serializer.is_valid():
            item = serializer.save()
            contract.total_amount = sum(i.subtotal for i in contract.items.all())
            contract.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['delete'], url_path='remove-item/(?P<item_id>[^/.]+)')
    def remove_item(self, request, pk=None, item_id=None):
        contract = self.get_object()
        try:
            item = contract.items.get(id=item_id)
            item.delete()
            contract.total_amount = sum(i.subtotal for i in contract.items.all())
            contract.save()
            return Response({'status': 'success'})
        except ContractItem.DoesNotExist:
            return Response({'detail': '项目不存在'}, status=404)

    @action(detail=True, methods=['post'], url_path='record-payment')
    def record_payment(self, request, pk=None):
        contract = self.get_object()
        payment = PaymentRecord.objects.create(
            contract=contract,
            amount=request.data.get('amount', 0),
            payment_method=request.data.get('payment_method', 'cash'),
            receipt_no=request.data.get('receipt_no', ''),
            notes=request.data.get('notes', ''),
            created_by=request.user
        )
        contract.paid_amount += payment.amount
        if contract.paid_amount >= contract.actual_amount:
            contract.payment_status = 'paid'
        elif contract.paid_amount > 0:
            contract.payment_status = 'partial'
        contract.save()
        return Response(PaymentRecordSerializer(payment).data)

    @action(detail=False, methods=['get'], url_path='pending-approval')
    def pending_approval(self, request):
        contracts = self.filter_queryset(self.get_queryset()).filter(approval_status='pending')
        page = self.paginate_queryset(contracts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(contracts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='my-contracts')
    def my_contracts(self, request):
        contracts = self.filter_queryset(self.get_queryset()).filter(
            sales_person=request.user
        ) | self.filter_queryset(self.get_queryset()).filter(
            doctor=request.user
        )
        contracts = contracts.distinct()
        page = self.paginate_queryset(contracts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(contracts, many=True)
        return Response(serializer.data)


class ContractAttachmentViewSet(viewsets.ModelViewSet):
    queryset = ContractAttachment.objects.all()
    serializer_class = ContractAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['contract']

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class ApprovalRecordViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ApprovalRecord.objects.all()
    serializer_class = ApprovalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['contract', 'action']
    ordering_fields = ['created_at']
    ordering = ['-created_at']


class PaymentRecordViewSet(viewsets.ModelViewSet):
    queryset = PaymentRecord.objects.all()
    serializer_class = PaymentRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['contract', 'payment_method']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
