from django.db.models import Count, Avg, Q, F, ExpressionWrapper, fields
from django.utils import timezone
from datetime import timedelta, date
from apps.tickets.models import Ticket
from apps.accounts.models import User


class DurationReportService:
    @staticmethod
    def get_duration_stats(start_date=None, end_date=None, group_by='type'):
        queryset = Ticket.objects.all()

        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)

        tickets_with_response = queryset.filter(first_response_at__isnull=False)
        tickets_resolved = queryset.filter(resolved_at__isnull=False)

        avg_first_response = tickets_with_response.aggregate(
            avg=Avg(F('first_response_at') - F('created_at'))
        )['avg']
        avg_first_response_sec = avg_first_response.total_seconds() if avg_first_response else 0

        avg_resolution = tickets_resolved.aggregate(
            avg=Avg(F('resolved_at') - F('created_at'))
        )['avg']
        avg_resolution_sec = avg_resolution.total_seconds() if avg_resolution else 0

        tickets_closed = queryset.filter(closed_at__isnull=False)
        avg_total = tickets_closed.aggregate(
            avg=Avg(F('closed_at') - F('created_at'))
        )['avg']
        avg_total_sec = avg_total.total_seconds() if avg_total else 0

        by_type = DurationReportService._group_by_field(queryset, 'type')
        by_priority = DurationReportService._group_by_field(queryset, 'priority')
        by_assignee = DurationReportService._group_by_assignee(queryset)
        by_period = DurationReportService._group_by_period(queryset, start_date, end_date)

        return {
            'avg_first_response': avg_first_response_sec,
            'avg_resolution': avg_resolution_sec,
            'avg_total': avg_total_sec,
            'by_type': by_type,
            'by_priority': by_priority,
            'by_assignee': by_assignee,
            'by_period': by_period,
        }

    @staticmethod
    def _group_by_field(queryset, field):
        result = {}
        items = queryset.values(field).annotate(
            count=Count('id'),
            avg_response=Avg(F('first_response_at') - F('created_at'),
                             filter=Q(first_response_at__isnull=False)),
            avg_resolution=Avg(F('resolved_at') - F('created_at'),
                               filter=Q(resolved_at__isnull=False)),
        )
        for item in items:
            key = item[field]
            if key:
                result[key] = {
                    'count': item['count'],
                    'avg_response': item['avg_response'].total_seconds() if item['avg_response'] else 0,
                    'avg_resolution': item['avg_resolution'].total_seconds() if item['avg_resolution'] else 0,
                }
        return result

    @staticmethod
    def _group_by_assignee(queryset):
        items = queryset.filter(assignee__isnull=False).values(
            assignee_id=F('assignee'),
            assignee_name=F('assignee__username'),
        ).annotate(
            count=Count('id'),
            avg_response=Avg(F('first_response_at') - F('created_at'),
                             filter=Q(first_response_at__isnull=False)),
            avg_resolution=Avg(F('resolved_at') - F('created_at'),
                               filter=Q(resolved_at__isnull=False)),
        )
        return list(items)

    @staticmethod
    def _group_by_period(queryset, start_date, end_date):
        if not start_date:
            start_date = (timezone.now() - timedelta(days=30)).date()
        if not end_date:
            end_date = timezone.now().date()

        periods = []
        current = start_date
        while current <= end_date:
            next_day = current + timedelta(days=1)
            day_tickets = queryset.filter(created_at__date=current)
            with_response = day_tickets.filter(first_response_at__isnull=False)
            resolved = day_tickets.filter(resolved_at__isnull=False)

            avg_response = with_response.aggregate(
                avg=Avg(F('first_response_at') - F('created_at'))
            )['avg']
            avg_resolution = resolved.aggregate(
                avg=Avg(F('resolved_at') - F('created_at'))
            )['avg']

            periods.append({
                'date': current.isoformat(),
                'count': day_tickets.count(),
                'avg_response': avg_response.total_seconds() if avg_response else 0,
                'avg_resolution': avg_resolution.total_seconds() if avg_resolution else 0,
            })
            current = next_day

        return periods


class ResultReportService:
    @staticmethod
    def get_result_stats(start_date=None, end_date=None):
        queryset = Ticket.objects.all()

        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)

        total = queryset.count()
        resolved = queryset.filter(status='resolved').count()
        closed = queryset.filter(status='closed').count()

        resolution_rate = ((resolved + closed) / total * 100) if total > 0 else 0

        tickets_with_score = queryset.filter(satisfaction_score__isnull=False)
        avg_satisfaction = tickets_with_score.aggregate(
            avg=Avg('satisfaction_score')
        )['avg'] or 0

        satisfaction_dist = dict(
            tickets_with_score.values('satisfaction_score').annotate(
                count=Count('id')
            ).values_list('satisfaction_score', 'count')
        )

        by_result = {
            'pending': queryset.filter(status='pending').count(),
            'processing': queryset.filter(status='processing').count(),
            'escalated': queryset.filter(status='escalated').count(),
            'resolved': resolved,
            'closed': closed,
        }

        by_type = dict(
            queryset.values('type').annotate(
                total=Count('id'),
                resolved=Count('id', filter=Q(status__in=['resolved', 'closed'])),
            ).values_list('type', 'total', 'resolved')
        )
        by_type = {k: {'total': v[0], 'resolved': v[1]} for k, v in by_type.items()}

        return {
            'total': total,
            'resolved': resolved,
            'closed': closed,
            'resolution_rate': resolution_rate,
            'avg_satisfaction': avg_satisfaction,
            'satisfaction_distribution': satisfaction_dist,
            'by_result': by_result,
            'by_type': by_type,
        }


class TrendReportService:
    @staticmethod
    def get_trend_stats(days=30, period='day'):
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days - 1)

        trends = []
        current = start_date
        delta = timedelta(days=1) if period == 'day' else timedelta(days=7)

        while current <= end_date:
            if period == 'day':
                next_period = current + delta
                period_label = current.isoformat()
            else:
                next_period = current + delta
                period_label = f'{current.isoformat()} - {min(next_period - timedelta(days=1), end_date).isoformat()}'

            period_tickets = Ticket.objects.filter(
                created_at__date__gte=current,
                created_at__date__lt=next_period
            )

            new_tickets = period_tickets.count()
            resolved_tickets = Ticket.objects.filter(
                resolved_at__date__gte=current,
                resolved_at__date__lt=next_period
            ).count()
            closed_tickets = Ticket.objects.filter(
                closed_at__date__gte=current,
                closed_at__date__lt=next_period
            ).count()

            with_response = period_tickets.filter(first_response_at__isnull=False)
            avg_response = with_response.aggregate(
                avg=Avg(F('first_response_at') - F('created_at'))
            )['avg']

            period_resolved = period_tickets.filter(resolved_at__isnull=False)
            avg_resolution = period_resolved.aggregate(
                avg=Avg(F('resolved_at') - F('created_at'))
            )['avg']

            trends.append({
                'period': period_label,
                'new_tickets': new_tickets,
                'resolved_tickets': resolved_tickets,
                'closed_tickets': closed_tickets,
                'avg_response_time': avg_response.total_seconds() if avg_response else 0,
                'avg_resolution_time': avg_resolution.total_seconds() if avg_resolution else 0,
            })
            current = next_period

        all_tickets = Ticket.objects.filter(created_at__date__gte=start_date)
        total_new = all_tickets.count()
        total_resolved = Ticket.objects.filter(
            resolved_at__date__gte=start_date
        ).count()
        total_closed = Ticket.objects.filter(
            closed_at__date__gte=start_date
        ).count()

        summary = {
            'period_days': days,
            'total_new': total_new,
            'total_resolved': total_resolved,
            'total_closed': total_closed,
            'avg_daily_new': round(total_new / days, 2),
            'avg_daily_resolved': round(total_resolved / days, 2),
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
        }

        return {
            'trends': trends,
            'summary': summary,
        }
