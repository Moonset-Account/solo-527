from django.db import models


class DashboardService:
    @staticmethod
    def get_overview_stats(user):
        from apps.children.models import Child, ChildClass
        from apps.pickup.models import PickupRecord
        from apps.notifications.models import Notification
        from apps.payments.models import Invoice
        from apps.leave.models import LeaveRequest
        from django.utils import timezone
        from django.db.models import Count, Sum, Q

        today = timezone.now().date()
        data = {}

        if user.role in ['director', 'teacher']:
            class_ids = None
            if user.role == 'teacher':
                class_ids = user.teacher_profile.classes.values_list('id', flat=True)

            children_qs = Child.objects.filter(status='active', is_deleted=False)
            if class_ids:
                children_qs = children_qs.filter(child_class_id__in=class_ids)
            data['total_children'] = children_qs.count()

            pickup_qs = PickupRecord.objects.filter(is_deleted=False, pickup_time__date=today)
            if class_ids:
                pickup_qs = pickup_qs.filter(child__child_class_id__in=class_ids)
            data['today_dropoff'] = pickup_qs.filter(pickup_type='dropoff', status='verified').count()
            data['today_pickup'] = pickup_qs.filter(pickup_type='pickup', status='verified').count()
            data['pending_pickup'] = pickup_qs.filter(status='pending').count()

            leave_qs = LeaveRequest.objects.filter(is_deleted=False)
            if class_ids:
                leave_qs = leave_qs.filter(child__child_class_id__in=class_ids)
            data['pending_leave'] = leave_qs.filter(status='pending').count()
            data['today_leave'] = leave_qs.filter(
                start_date__lte=today,
                end_date__gte=today,
                status='approved'
            ).count()

        if user.role in ['director']:
            invoice_qs = Invoice.objects.filter(is_deleted=False)
            data['pending_payment'] = invoice_qs.filter(status='pending').count()
            data['overdue_payment'] = invoice_qs.filter(status='overdue').count()
            data['total_receivable'] = invoice_qs.filter(
                status__in=['pending', 'overdue']
            ).aggregate(total=Sum('amount', default=0))['total']

        notif_qs = Notification.objects.filter(is_deleted=False, status='published')
        data['recent_notifications'] = notif_qs.count()

        return data

    @staticmethod
    def get_pickup_trend(user, days=7):
        from apps.pickup.models import PickupRecord
        from django.utils import timezone, dateformat
        from django.db.models import Count

        end_date = timezone.now().date()
        start_date = end_date - timezone.timedelta(days=days-1)

        class_ids = None
        if user.role == 'teacher':
            class_ids = user.teacher_profile.classes.values_list('id', flat=True)

        qs = PickupRecord.objects.filter(
            is_deleted=False,
            status='verified',
            pickup_time__date__range=[start_date, end_date]
        )
        if class_ids:
            qs = qs.filter(child__child_class_id__in=class_ids)

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
    def get_class_utilization(user):
        from apps.children.models import ChildClass, Child
        from django.db.models import Count

        qs = ChildClass.objects.filter(is_deleted=False).annotate(
            current_count=Count('children', filter=Count('children', filter=models.Q(children__status='active', children__is_deleted=False)))
        )

        if user.role == 'teacher':
            qs = qs.filter(teachers=user.teacher_profile)

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
    def get_status_breakdown(user):
        from apps.pickup.models import PickupRecord
        from apps.leave.models import LeaveRequest
        from apps.payments.models import Invoice
        from django.db.models import Count

        return {
            'pickup_status': list(
                PickupRecord.objects.filter(is_deleted=False).values('status').annotate(count=Count('id'))
            ),
            'leave_status': list(
                LeaveRequest.objects.filter(is_deleted=False).values('status').annotate(count=Count('id'))
            ),
            'payment_status': list(
                Invoice.objects.filter(is_deleted=False).values('status').annotate(count=Count('id'))
            )
        }
