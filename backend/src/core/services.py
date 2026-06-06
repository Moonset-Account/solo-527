from django.db import models


class DashboardService:
    @staticmethod
    def _apply_filters(qs, filters, user, date_field=None):
        if filters.get('class_id'):
            if hasattr(qs.model, 'child_class'):
                qs = qs.filter(child_class_id=filters['class_id'])
            elif hasattr(qs.model, 'child'):
                qs = qs.filter(child__child_class_id=filters['class_id'])
            elif hasattr(qs.model, 'children'):
                qs = qs.filter(id=filters['class_id'])

        if filters.get('start_date') and date_field:
            qs = qs.filter(**{f'{date_field}__date__gte': filters['start_date']})
        if filters.get('end_date') and date_field:
            qs = qs.filter(**{f'{date_field}__date__lte': filters['end_date']})

        if filters.get('status'):
            if hasattr(qs.model, 'status'):
                qs = qs.filter(status=filters['status'])

        if user.role == 'teacher' and hasattr(user, 'teacher_profile'):
            class_ids = user.teacher_profile.classes.values_list('id', flat=True)
            if hasattr(qs.model, 'child_class'):
                qs = qs.filter(child_class_id__in=class_ids)
            elif hasattr(qs.model, 'child'):
                qs = qs.filter(child__child_class_id__in=class_ids)
            elif hasattr(qs.model, 'teachers'):
                qs = qs.filter(teachers=user.teacher_profile)

        return qs

    @staticmethod
    def get_overview_stats(user, filters=None):
        from apps.children.models import Child, ChildClass
        from apps.pickup.models import PickupRecord
        from apps.notifications.models import Notification
        from apps.payments.models import Invoice
        from apps.leave.models import LeaveRequest
        from django.utils import timezone
        from django.db.models import Count, Sum, Q

        filters = filters or {}
        today = timezone.now().date()
        data = {}

        if user.role in ['director', 'teacher']:
            children_qs = Child.objects.filter(status='active', is_deleted=False)
            children_qs = DashboardService._apply_filters(children_qs, filters, user)
            data['total_children'] = children_qs.count()

            pickup_qs = PickupRecord.objects.filter(is_deleted=False, pickup_time__date=today)
            pickup_qs = DashboardService._apply_filters(pickup_qs, filters, user, 'pickup_time')
            data['today_dropoff'] = pickup_qs.filter(pickup_type='dropoff', status='verified').count()
            data['today_pickup'] = pickup_qs.filter(pickup_type='pickup', status='verified').count()
            data['pending_pickup'] = pickup_qs.filter(status='pending').count()

            leave_qs = LeaveRequest.objects.filter(is_deleted=False)
            leave_qs = DashboardService._apply_filters(leave_qs, filters, user)
            data['pending_leave'] = leave_qs.filter(status='pending').count()
            data['today_leave'] = leave_qs.filter(
                start_date__lte=today,
                end_date__gte=today,
                status='approved'
            ).count()

        if user.role in ['director']:
            invoice_qs = Invoice.objects.filter(is_deleted=False)
            invoice_qs = DashboardService._apply_filters(invoice_qs, filters, user)
            data['pending_payment'] = invoice_qs.filter(status='pending').count()
            data['overdue_payment'] = invoice_qs.filter(status='overdue').count()
            data['total_receivable'] = invoice_qs.filter(
                status__in=['pending', 'overdue']
            ).aggregate(total=Sum('amount', default=0))['total']

        notif_qs = Notification.objects.filter(is_deleted=False, status='published')
        data['recent_notifications'] = notif_qs.count()

        return data

    @staticmethod
    def get_pickup_trend(user, days=7, filters=None):
        from apps.pickup.models import PickupRecord
        from django.utils import timezone
        from django.db.models import Count

        filters = filters or {}
        end_date = timezone.now().date()
        start_date = end_date - timezone.timedelta(days=days-1)

        if filters.get('start_date'):
            start_date = timezone.datetime.strptime(filters['start_date'], '%Y-%m-%d').date()
        if filters.get('end_date'):
            end_date = timezone.datetime.strptime(filters['end_date'], '%Y-%m-%d').date()
            days = (end_date - start_date).days + 1

        qs = PickupRecord.objects.filter(
            is_deleted=False,
            status='verified',
            pickup_time__date__range=[start_date, end_date]
        )
        qs = DashboardService._apply_filters(qs, filters, user, 'pickup_time')

        trend = qs.values('pickup_time__date', 'pickup_type').annotate(
            count=Count('id')
        ).order_by('pickup_time__date')

        date_list = [start_date + timezone.timedelta(days=i) for i in range(days)]
        result = []
        for d in date_list:
            day_data = {'date': d.isoformat(), 'dropoff': 0, 'pickup': 0}
            for item in trend:
                if item['pickup_time__date'] == d:
                    day_data[item['pickup_type']] = item['count']
            result.append(day_data)
        return result

    @staticmethod
    def get_class_utilization(user, filters=None):
        from apps.children.models import ChildClass, Child
        from django.db.models import Count, Q

        filters = filters or {}
        qs = ChildClass.objects.filter(is_deleted=False).annotate(
            current_count=Count('children', filter=Q(children__status='active', children__is_deleted=False))
        )
        qs = DashboardService._apply_filters(qs, filters, user)

        return [
            {
                'id': c.id,
                'name': c.name,
                'capacity': c.capacity,
                'current': c.current_count,
                'utilization': round(c.current_count / c.capacity * 100, 1) if c.capacity > 0 else 0
            }
            for c in qs
        ]

    @staticmethod
    def get_status_breakdown(user, filters=None):
        from apps.pickup.models import PickupRecord
        from apps.leave.models import LeaveRequest
        from apps.payments.models import Invoice
        from django.db.models import Count

        filters = filters or {}

        pickup_qs = PickupRecord.objects.filter(is_deleted=False)
        pickup_qs = DashboardService._apply_filters(pickup_qs, filters, user, 'pickup_time')

        leave_qs = LeaveRequest.objects.filter(is_deleted=False)
        leave_qs = DashboardService._apply_filters(leave_qs, filters, user)

        payment_qs = Invoice.objects.filter(is_deleted=False)
        payment_qs = DashboardService._apply_filters(payment_qs, filters, user)

        return {
            'pickup_status': list(pickup_qs.values('status').annotate(count=Count('id'))),
            'leave_status': list(leave_qs.values('status').annotate(count=Count('id'))),
            'payment_status': list(payment_qs.values('status').annotate(count=Count('id')))
        }
