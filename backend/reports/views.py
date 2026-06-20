from django.utils import timezone
from openpyxl import Workbook
from rest_framework import generics, status
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework.response import Response

from reconciliations.models import Difference, Reconciliation
from reminders.models import Reminder

from .serializers import OverdueDetailSerializer, MismatchRecordSerializer, LastActionSerializer


class IsAdminOrFinance(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ('admin', 'finance')


def _build_overdue_data():
    today = timezone.now().date()
    reminders = Reminder.objects.filter(
        status__in=('pending', 'escalated')
    ).select_related('reconciliation', 'assignee')

    data = []
    for r in reminders:
        overdue_days = (today - r.due_date).days if today > r.due_date else 0
        rec = r.reconciliation
        data.append({
            'reminder_id': r.id,
            'reconciliation_id': rec.id,
            'project_name': rec.project_name,
            'client_name': rec.client_name,
            'total_amount': rec.total_amount,
            'difference_amount': rec.difference_amount,
            'overdue_days': overdue_days,
            'assignee_id': r.assignee_id,
            'assignee_name': r.assignee.get_full_name() or r.assignee.username,
            'priority': r.priority,
            'status': r.status,
            'escalation_level': r.escalation_level,
            'due_date': r.due_date,
        })
    return data


class OverdueView(generics.ListAPIView):
    serializer_class = OverdueDetailSerializer
    permission_classes = [IsAuthenticated, IsAdminOrFinance]

    def get_queryset(self):
        return _build_overdue_data()


class MismatchView(generics.ListAPIView):
    serializer_class = MismatchRecordSerializer
    permission_classes = [IsAuthenticated, IsAdminOrFinance]

    def get_queryset(self):
        differences = Difference.objects.filter(
            item_type='amount'
        ).select_related('reconciliation')

        data = []
        for d in differences:
            rec = d.reconciliation
            data.append({
                'difference_id': d.id,
                'reconciliation_id': rec.id,
                'project_name': rec.project_name,
                'client_name': rec.client_name,
                'item_type': d.item_type,
                'system_value': d.system_value,
                'uploaded_value': d.uploaded_value,
                'is_confirmed': d.is_confirmed,
            })
        return data


class LastActionView(generics.ListAPIView):
    serializer_class = LastActionSerializer
    permission_classes = [IsAuthenticated, IsAdminOrFinance]

    def get_queryset(self):
        reminders = Reminder.objects.filter(
            status__in=('pending', 'escalated')
        ).select_related('reconciliation', 'assignee')

        seen = set()
        data = []
        for r in reminders.order_by('-created_at'):
            rec_id = r.reconciliation_id
            if rec_id in seen:
                continue
            seen.add(rec_id)
            rec = r.reconciliation
            data.append({
                'reminder_id': r.id,
                'reconciliation_id': rec.id,
                'project_name': rec.project_name,
                'assignee_name': r.assignee.get_full_name() or r.assignee.username,
                'status': r.status,
                'handled_at': r.handled_at,
                'escalation_level': r.escalation_level,
            })
        return data


class OverdueExportView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrFinance]

    def get(self, request, *args, **kwargs):
        data = _build_overdue_data()

        wb = Workbook()
        ws = wb.active
        ws.title = 'Overdue Details'

        headers = [
            'Reminder ID', 'Reconciliation ID', 'Project Name', 'Client Name',
            'Total Amount', 'Difference Amount', 'Overdue Days',
            'Assignee ID', 'Assignee Name', 'Priority', 'Status',
            'Escalation Level', 'Due Date',
        ]
        ws.append(headers)

        for row in data:
            ws.append([
                row['reminder_id'], row['reconciliation_id'],
                row['project_name'], row['client_name'],
                str(row['total_amount']), str(row['difference_amount']),
                row['overdue_days'], row['assignee_id'],
                row['assignee_name'], row['priority'], row['status'],
                row['escalation_level'], str(row['due_date']),
            ])

        from django.http import HttpResponse
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = 'attachment; filename="overdue_report.xlsx"'
        wb.save(response)
        return response


class MismatchExportView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsAdminOrFinance]

    def get(self, request, *args, **kwargs):
        differences = Difference.objects.filter(
            item_type='amount'
        ).select_related('reconciliation')

        wb = Workbook()
        ws = wb.active
        ws.title = 'Mismatch Records'

        headers = [
            'Difference ID', 'Reconciliation ID', 'Project Name', 'Client Name',
            'Item Type', 'System Value', 'Uploaded Value', 'Is Confirmed',
        ]
        ws.append(headers)

        for d in differences:
            rec = d.reconciliation
            ws.append([
                d.id, rec.id, rec.project_name, rec.client_name,
                d.item_type, d.system_value, d.uploaded_value,
                str(d.is_confirmed),
            ])

        from django.http import HttpResponse
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        response['Content-Disposition'] = 'attachment; filename="mismatch_report.xlsx"'
        wb.save(response)
        return response
