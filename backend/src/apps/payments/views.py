from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import PaymentItem, Invoice, PaymentRecord
from .serializers import PaymentItemSerializer, InvoiceSerializer, PaymentRecordSerializer
from core.permissions import IsDirector, IsTeacherOrDirector, IsParent


class PaymentItemViewSet(viewsets.ModelViewSet):
    queryset = PaymentItem.objects.filter(is_deleted=False)
    serializer_class = PaymentItemSerializer
    permission_classes = [IsDirector]
    search_fields = ['name']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.filter(is_deleted=False)
    serializer_class = InvoiceSerializer
    permission_classes = [IsTeacherOrDirector | IsParent]
    filterset_fields = ['child', 'item', 'status', 'bill_date', 'due_date']
    search_fields = ['child__name']
    ordering_fields = ['bill_date', 'due_date', 'amount']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'parent':
            qs = qs.filter(child__parents=user)
        elif user.role == 'teacher':
            class_ids = user.teacher_profile.classes.values_list('id', flat=True)
            qs = qs.filter(child__child_class_id__in=class_ids)
        return qs

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'mark_paid', 'send_reminder']:
            return [IsTeacherOrDirector()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        amount = request.data.get('amount', invoice.remaining_amount)
        payment_method = request.data.get('payment_method', '现金')
        transaction_id = request.data.get('transaction_id', '')
        notes = request.data.get('notes', '')

        if float(amount) <= 0:
            return Response({'error': '缴费金额必须大于0'}, status=status.HTTP_400_BAD_REQUEST)
        if float(amount) > float(invoice.remaining_amount):
            return Response({'error': '缴费金额不能超过剩余金额'}, status=status.HTTP_400_BAD_REQUEST)

        PaymentRecord.objects.create(
            invoice=invoice,
            amount=amount,
            payment_method=payment_method,
            transaction_id=transaction_id,
            paid_by=request.user,
            notes=notes,
            created_by=request.user
        )

        invoice.paid_amount += float(amount)
        if invoice.paid_amount >= invoice.amount:
            invoice.status = 'paid'
            invoice.paid_at = timezone.now()
            invoice.paid_by = request.user
            invoice.payment_method = payment_method
        invoice.updated_by = request.user
        invoice.save()

        return Response(InvoiceSerializer(invoice).data)

    @action(detail=True, methods=['post'])
    def send_reminder(self, request, pk=None):
        invoice = self.get_object()
        invoice.reminder_sent = True
        invoice.last_reminder_at = timezone.now()
        invoice.updated_by = request.user
        invoice.save()
        return Response({'status': 'success', 'message': '提醒已发送'})

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        from django.db.models import Sum, Count
        qs = self.get_queryset()
        stats = qs.aggregate(
            total_count=Count('id'),
            pending_count=Count('id', filter=models.Q(status='pending')),
            paid_count=Count('id', filter=models.Q(status='paid')),
            overdue_count=Count('id', filter=models.Q(status='overdue')),
            total_amount=Sum('amount', default=0),
            paid_amount=Sum('paid_amount', default=0),
            pending_amount=Sum('amount', filter=models.Q(status='pending'), default=0),
        )
        return Response(stats)


class PaymentRecordViewSet(viewsets.ModelViewSet):
    queryset = PaymentRecord.objects.filter(is_deleted=False)
    serializer_class = PaymentRecordSerializer
    permission_classes = [IsTeacherOrDirector]
    filterset_fields = ['invoice', 'payment_method', 'paid_at']
    ordering_fields = ['paid_at']

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'parent':
            qs = qs.filter(invoice__child__parents=user)
        elif user.role == 'teacher':
            class_ids = user.teacher_profile.classes.values_list('id', flat=True)
            qs = qs.filter(invoice__child__child_class_id__in=class_ids)
        return qs
