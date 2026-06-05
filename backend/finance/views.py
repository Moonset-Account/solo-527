from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from common.permissions import IsAdmin, IsAdminOrTeacher, IsAdminOrReadOnly, IsOwnerOrAdmin
from common.audit import log_audit
from common.validators import validate_date_range
from .models import FeeItem, Payment, LeaveRequest
from .serializers import (
    FeeItemSerializer, PaymentSerializer,
    LeaveRequestSerializer, LeaveRequestCreateSerializer, LeaveReviewSerializer,
)


class FeeItemListView(generics.ListCreateAPIView):
    queryset = FeeItem.objects.all().order_by('-created_at')
    serializer_class = FeeItemSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filterset_fields = ['fee_type', 'is_active', 'class_group']
    search_fields = ['name']

    def perform_create(self, serializer):
        obj = serializer.save(created_by=self.request.user)
        log_audit(self.request.user, 'create', 'FeeItem', obj.pk)


class FeeItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = FeeItem.objects.all().order_by('-created_at')
    serializer_class = FeeItemSerializer
    permission_classes = [IsAuthenticated, IsAdmin]


class PaymentListView(generics.ListCreateAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filterset_fields = ['child', 'status', 'fee_item']
    search_fields = ['child__name']

    def get_queryset(self):
        qs = Payment.objects.select_related('child', 'fee_item').order_by('-created_at')
        if self.request.user.role == 'parent':
            qs = qs.filter(child__parent_relations__parent=self.request.user)
        return qs.distinct()


class PaymentDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def get_queryset(self):
        return Payment.objects.select_related('child', 'fee_item')

    def perform_update(self, serializer):
        obj = serializer.save()
        log_audit(self.request.user, 'update', 'Payment', obj.pk,
                  detail=f'状态: {obj.get_status_display()}')


class PaymentExportView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        from common.export import validate_and_export
        qs = Payment.objects.select_related('child', 'fee_item').order_by('-created_at').all()
        fields = ['id', 'child__name', 'fee_item__name', 'amount', 'paid_amount',
                  'status', 'due_date', 'paid_at', 'created_at']
        labels = {
            'id': 'ID', 'child__name': '儿童', 'fee_item__name': '费用项目',
            'amount': '应缴金额', 'paid_amount': '实缴金额', 'status': '状态',
            'due_date': '截止日期', 'paid_at': '缴费时间', 'created_at': '创建时间',
        }
        log_audit(request.user, 'export', 'Payment', detail='导出缴费记录')
        return validate_and_export(qs, fields, field_labels=labels, filename='缴费记录.csv')


class LeaveRequestListView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    filterset_fields = ['child', 'status', 'requester']
    search_fields = ['child__name']

    def get_queryset(self):
        qs = LeaveRequest.objects.select_related('child', 'requester', 'reviewed_by').order_by('-created_at')
        if self.request.user.role == 'parent':
            qs = qs.filter(requester=self.request.user)
        elif self.request.user.role == 'teacher':
            qs = qs.filter(child__class_group__teacher=self.request.user)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return LeaveRequestCreateSerializer
        return LeaveRequestSerializer

    def perform_create(self, serializer):
        obj = serializer.save(requester=self.request.user)
        log_audit(self.request.user, 'create', 'LeaveRequest', obj.pk)


class LeaveRequestDetailView(generics.RetrieveUpdateAPIView):
    queryset = LeaveRequest.objects.select_related('child', 'requester', 'reviewed_by')
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]


class LeaveReviewView(generics.GenericAPIView):
    serializer_class = LeaveReviewSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTeacher]

    def post(self, request, pk):
        from django.utils import timezone
        try:
            leave = LeaveRequest.objects.get(pk=pk)
        except LeaveRequest.DoesNotExist:
            return Response({'detail': '请假申请不存在'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data['action']
        leave.status = action
        leave.reviewed_by = request.user
        leave.reviewed_at = timezone.now()
        leave.review_remark = serializer.validated_data.get('review_remark', '')
        leave.save()
        log_audit(request.user, action, 'LeaveRequest', leave.pk)
        return Response(LeaveRequestSerializer(leave).data)
