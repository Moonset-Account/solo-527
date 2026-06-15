from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, F, Q
from django.db.models.functions import TruncDate, TruncMonth, ExtractWeekDay
from django.utils import timezone
from datetime import timedelta
from leads.models import Lead, LeadStatus, LeadSource, TimeoutRecord
from contracts.models import Contract
from consultations.models import ConsultationRecord
from users.models import User
from common.models import OperationLog


class SalesFunnelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        leads_query = Lead.objects.all()
        if start_date:
            leads_query = leads_query.filter(created_at__gte=start_date)
        if end_date:
            leads_query = leads_query.filter(created_at__lte=end_date)

        total_leads = leads_query.count()

        contacted = leads_query.filter(status__stage='contacted').count()
        consulting = leads_query.filter(status__stage='consulting').count()
        quoting = leads_query.filter(status__stage='quoting').count()
        negotiating = leads_query.filter(status__stage='negotiating').count()
        contracting = leads_query.filter(status__stage='contracting').count()
        won = leads_query.filter(status__stage='won').count()
        lost = leads_query.filter(status__stage='lost').count()

        contracts_query = Contract.objects.filter(approval_status='approved')
        if start_date:
            contracts_query = contracts_query.filter(created_at__gte=start_date)
        if end_date:
            contracts_query = contracts_query.filter(created_at__lte=end_date)

        total_contracts = contracts_query.count()
        total_amount = contracts_query.aggregate(Sum('actual_amount'))['actual_amount__sum'] or 0

        conversion_rates = {
            'to_contacted': round(contacted / total_leads * 100, 2) if total_leads > 0 else 0,
            'to_consulting': round(consulting / total_leads * 100, 2) if total_leads > 0 else 0,
            'to_quoting': round(quoting / total_leads * 100, 2) if total_leads > 0 else 0,
            'to_won': round(won / total_leads * 100, 2) if total_leads > 0 else 0,
        }

        return Response({
            'funnel': [
                {'stage': '线索总数', 'count': total_leads, 'amount': 0},
                {'stage': '已联系', 'count': contacted, 'amount': 0},
                {'stage': '咨询中', 'count': consulting, 'amount': 0},
                {'stage': '报价中', 'count': quoting, 'amount': 0},
                {'stage': '谈判中', 'count': negotiating, 'amount': 0},
                {'stage': '签约中', 'count': contracting, 'amount': 0},
                {'stage': '已成交', 'count': won, 'amount': total_amount},
            ],
            'conversion_rates': conversion_rates,
            'summary': {
                'total_leads': total_leads,
                'total_contracts': total_contracts,
                'total_amount': total_amount,
                'average_amount': total_amount / total_contracts if total_contracts > 0 else 0,
                'lost_count': lost,
                'lost_rate': round(lost / total_leads * 100, 2) if total_leads > 0 else 0,
            }
        })


class LeadSourceReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sources = LeadSource.objects.filter(is_active=True)
        data = []
        for source in sources:
            leads = Lead.objects.filter(source=source)
            total = leads.count()
            won = leads.filter(status__stage='won').count()
            total_amount = Contract.objects.filter(
                lead__source=source,
                approval_status='approved'
            ).aggregate(Sum('actual_amount'))['actual_amount__sum'] or 0
            data.append({
                'id': source.id,
                'name': source.name,
                'total_leads': total,
                'won_count': won,
                'conversion_rate': round(won / total * 100, 2) if total > 0 else 0,
                'total_amount': total_amount,
                'avg_amount': total_amount / won if won > 0 else 0,
            })
        data.sort(key=lambda x: x['total_leads'], reverse=True)
        return Response(data)


class SalesPerformanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.filter(is_active=True, role__isnull=False)
        data = []
        for user in users:
            assigned_leads = Lead.objects.filter(assigned_to=user).count()
            won_leads = Lead.objects.filter(assigned_to=user, status__stage='won').count()
            contracts = Contract.objects.filter(sales_person=user, approval_status='approved')
            total_contracts = contracts.count()
            total_amount = contracts.aggregate(Sum('actual_amount'))['actual_amount__sum'] or 0
            consultations = ConsultationRecord.objects.filter(consultant=user).count()

            data.append({
                'id': user.id,
                'name': user.full_name or user.email,
                'role': user.role.display_name if user.role else '',
                'assigned_leads': assigned_leads,
                'won_leads': won_leads,
                'conversion_rate': round(won_leads / assigned_leads * 100, 2) if assigned_leads > 0 else 0,
                'total_contracts': total_contracts,
                'total_amount': total_amount,
                'consultations': consultations,
            })
        data.sort(key=lambda x: x['total_amount'], reverse=True)
        return Response(data)


class TimeoutReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        query = TimeoutRecord.objects.all()
        if start_date:
            query = query.filter(created_at__gte=start_date)
        if end_date:
            query = query.filter(created_at__lte=end_date)

        total_timeouts = query.count()
        handled = query.filter(is_handled=True).count()
        unhandled = query.filter(is_handled=False).count()

        by_person = query.values('responsible_person', 'responsible_person__full_name').annotate(
            count=Count('id'),
            avg_duration=Sum('timeout_duration') / Count('id')
        ).order_by('-count')

        by_type = query.values('timeout_type').annotate(
            count=Count('id')
        ).order_by('-count')

        return Response({
            'summary': {
                'total': total_timeouts,
                'handled': handled,
                'unhandled': unhandled,
                'handled_rate': round(handled / total_timeouts * 100, 2) if total_timeouts > 0 else 0,
            },
            'by_person': list(by_person),
            'by_type': list(by_type),
        })


class TrendReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get('period', 'month')
        days = int(request.query_params.get('days', 30))

        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)

        leads_by_date = Lead.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')

        contracts_by_date = Contract.objects.filter(
            approval_status='approved',
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            count=Count('id'),
            amount=Sum('actual_amount')
        ).order_by('date')

        leads_list = list(leads_by_date)
        contracts_list = list(contracts_by_date)

        return Response({
            'period': period,
            'start_date': start_date,
            'end_date': end_date,
            'leads_trend': leads_list,
            'contracts_trend': contracts_list,
        })


class ResponseNodeReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        nodes = Lead.objects.filter(response_node__isnull=False).exclude(
            response_node=''
        ).values('response_node').annotate(
            count=Count('id'),
            avg_duration=Sum('followup_count') / Count('id')
        ).order_by('-count')

        return Response(list(nodes))


class OperationLogReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)

        logs = OperationLog.objects.filter(
            created_at__gte=start_date
        )

        by_action = logs.values('action').annotate(
            count=Count('id')
        ).order_by('-count')

        by_user = logs.values('user', 'user__full_name').annotate(
            count=Count('id')
        ).order_by('-count')[:20]

        by_model = logs.values('content_type__model').annotate(
            count=Count('id')
        ).order_by('-count')

        return Response({
            'by_action': list(by_action),
            'by_user': list(by_user),
            'by_model': list(by_model),
            'total_operations': logs.count(),
        })
