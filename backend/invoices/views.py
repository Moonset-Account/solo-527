from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from datetime import date
from .models import Invoice, InvoiceItem, InvoiceStatusLog
from .serializers import (
    InvoiceSerializer, InvoiceCreateSerializer, InvoiceItemSerializer, InvoiceStatusLogSerializer
)
from users.permissions import IsFinanceOrReadOnly, IsFinance


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related(
        'supplier', 'contract', 'created_by', 'reviewed_by', 'paid_by'
    ).prefetch_related('items', 'status_logs')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['supplier', 'contract', 'status', 'invoice_type', 'invoice_date', 'due_date']
    search_fields = ['invoice_number', 'invoice_code', 'supplier__name', 'remarks']
    ordering_fields = ['invoice_date', 'total_amount', 'due_date', 'created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get'])
    def status_summary(self, request):
        summary = Invoice.objects.values('status').annotate(
            count=models.Count('id'),
            total_amount=models.Sum('total_amount')
        )
        return Response(summary)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        today = date.today()
        invoices = self.get_queryset().filter(
            status__in=['pending_payment', 'reviewed', 'pending_review'],
            due_date__lt=today
        ).order_by('due_date')
        serializer = self.get_serializer(invoices, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == 'draft':
            old_status = invoice.status
            invoice.status = 'pending_review'
            invoice.save()
            InvoiceStatusLog.objects.create(
                invoice=invoice, from_status=old_status, to_status=invoice.status,
                remark='提交审核', operated_by=request.user
            )
        return Response(self.get_serializer(invoice).data)

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        invoice = self.get_object()
        action = request.data.get('action')
        remark = request.data.get('remark', '')
        old_status = invoice.status
        if action == 'approve' and invoice.status == 'pending_review':
            invoice.status = 'reviewed'
            invoice.reviewed_by = request.user
        elif action == 'reject' and invoice.status == 'pending_review':
            invoice.status = 'rejected'
            invoice.reviewed_by = request.user
        invoice.save()
        InvoiceStatusLog.objects.create(
            invoice=invoice, from_status=old_status, to_status=invoice.status,
            remark=remark or ('审核通过' if action == 'approve' else '审核驳回'),
            operated_by=request.user
        )
        return Response(self.get_serializer(invoice).data)

    @action(detail=True, methods=['post'])
    def pay(self, request, pk=None):
        invoice = self.get_object()
        old_status = invoice.status
        payment_method = request.data.get('payment_method', invoice.payment_method)
        invoice.status = 'paid'
        invoice.paid_by = request.user
        invoice.actual_payment_date = date.today()
        invoice.payment_method = payment_method
        invoice.save()
        InvoiceStatusLog.objects.create(
            invoice=invoice, from_status=old_status, to_status=invoice.status,
            remark='完成付款', operated_by=request.user
        )
        return Response(self.get_serializer(invoice).data)


class InvoiceItemViewSet(viewsets.ModelViewSet):
    queryset = InvoiceItem.objects.select_related('invoice')
    serializer_class = InvoiceItemSerializer
    permission_classes = [IsAuthenticated, IsFinanceOrReadOnly]
    filterset_fields = ['invoice']


class InvoiceStatusLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InvoiceStatusLog.objects.select_related('invoice', 'operated_by')
    serializer_class = InvoiceStatusLogSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['invoice']
