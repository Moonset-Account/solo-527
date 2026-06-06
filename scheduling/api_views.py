from datetime import date
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import ScheduleConflict, Notification
from exhibitions.models import BorrowOrder, BorrowItem, TransportRecord, Exhibition


class CalendarEventsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start = request.GET.get('start')
        end = request.GET.get('end')

        events = []

        if start and end:
            start_date = date.fromisoformat(start.split('T')[0])
            end_date = date.fromisoformat(end.split('T')[0])

            exhibitions = Exhibition.objects.filter(
                Q(start_date__lte=end_date) & Q(end_date__gte=start_date),
                status__in=[Exhibition.PLANNING, Exhibition.INSTALLATION, Exhibition.OPEN]
            )

            for ex in exhibitions:
                events.append({
                    'id': f'ex_{ex.id}',
                    'title': ex.name,
                    'start': ex.start_date.isoformat(),
                    'end': ex.end_date.isoformat(),
                    'type': 'exhibition',
                    'status': ex.status,
                    'color': self._get_exhibition_color(ex.status),
                })

            borrow_orders = BorrowOrder.objects.filter(
                Q(expected_pickup_date__range=[start_date, end_date]) |
                Q(expected_return_date__range=[start_date, end_date]),
                status__in=[BorrowOrder.APPROVED, BorrowOrder.PICKED_UP, BorrowOrder.PARTIAL_RETURNED]
            )

            for order in borrow_orders:
                events.append({
                    'id': f'bo_{order.id}',
                    'title': f'借: ' + order.order_no,
                    'start': order.expected_pickup_date.isoformat(),
                    'end': order.expected_return_date.isoformat(),
                    'type': 'borrow_order',
                    'status': order.status,
                    'color': self._get_borrow_color(order.status),
                })

            conflicts = ScheduleConflict.objects.filter(
                conflict_date__range=[start_date, end_date],
                is_resolved=False
            )

            for conflict in conflicts:
                events.append({
                    'id': f'cf_{conflict.id}',
                    'title': conflict.get_type_display_name(),
                    'start': conflict.conflict_date.isoformat(),
                    'end': conflict.conflict_date.isoformat(),
                    'type': 'conflict',
                    'severity': conflict.severity,
                    'color': self._get_conflict_color(conflict.severity),
                })

        return Response(events)

    def _get_exhibition_color(self, status):
        colors = {
            'planning': '#3498db',
            'installation': '#f39c12',
            'open': '#2ecc71',
        }
        return colors.get(status, '#95a5a6')

    def _get_borrow_color(self, status):
        colors = {
            'approved': '#3498db',
            'picked_up': '#e74c3c',
            'partial_returned': '#f39c12',
        }
        return colors.get(status, '#95a5a6')

    def _get_conflict_color(self, severity):
        colors = {
            'low': '#2ecc71',
            'medium': '#f39c12',
            'high': '#e67e22',
            'critical': '#e74c3c',
        }
        return colors.get(severity, '#95a5a6')


class DaySummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, year, month, day):
        target_date = date(year, month, day)

        conflicts = ScheduleConflict.objects.filter(
            conflict_date=target_date,
            is_resolved=False
        ).count()

        unreturned = BorrowItem.objects.filter(
            status__in=['picked_up', 'pending'],
            borrow_order__expected_return_date__lt=target_date
        ).count()

        in_transit = TransportRecord.objects.filter(
            status='in_transit'
        ).count()

        borrow_pickups = BorrowOrder.objects.filter(
            expected_pickup_date=target_date
        ).count()

        borrow_returns = BorrowOrder.objects.filter(
            expected_return_date=target_date
        ).count()

        return Response({
            'date': target_date.isoformat(),
            'conflicts_count': conflicts,
            'unreturned_count': unreturned,
            'in_transit_count': in_transit,
            'pickups_count': borrow_pickups,
            'returns_count': borrow_returns,
        })


class UnreadNotificationCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()
        return Response({'unread_count': count})
