from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import date
from borrows.models import Borrow, BorrowStatus
from repairs.models import RepairRecord, RepairStatus
from activities.models import Activity, ActivityStatus, Registration, RegistrationStatus
from deposits.models import DepositAccount
from books.models import BookStatus

class LibrarianDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        
        today_returns = Borrow.objects.filter(
            status__in=[BorrowStatus.BORROWED, BorrowStatus.OVERDUE],
            due_date=today
        ).select_related('book', 'member')
        
        today_return_list = []
        for borrow in today_returns:
            today_return_list.append({
                'id': borrow.id,
                'book_title': borrow.book.title,
                'book_isbn': borrow.book.isbn,
                'member_name': borrow.member.family_name,
                'member_phone': borrow.member.phone,
                'due_date': borrow.due_date,
                'is_overdue': borrow.is_overdue(),
            })
        
        pending_repairs = RepairRecord.objects.filter(
            status__in=[RepairStatus.PENDING, RepairStatus.REPAIRING]
        ).select_related('book', 'reporter')
        
        pending_repair_list = []
        for repair in pending_repairs:
            pending_repair_list.append({
                'id': repair.id,
                'book_title': repair.book.title,
                'book_isbn': repair.book.isbn,
                'damage_level': repair.damage_level,
                'damage_level_display': repair.get_damage_level_display(),
                'status': repair.status,
                'reporter': repair.reporter.family_name,
                'create_time': repair.create_time,
            })
        
        waitlist_activities = Activity.objects.filter(
            status=ActivityStatus.UPCOMING,
            waitlist_count__gt=0
        ).prefetch_related('registrations')
        
        waitlist_list = []
        for activity in waitlist_activities:
            waitlist_regs = activity.registrations.filter(
                status=RegistrationStatus.WAITLIST
            ).select_related('member').order_by('waitlist_position')
            
            waitlist_items = []
            for reg in waitlist_regs[:5]:
                waitlist_items.append({
                    'id': reg.id,
                    'member_name': reg.member.family_name,
                    'position': reg.waitlist_position,
                })
            
            waitlist_list.append({
                'id': activity.id,
                'title': activity.title,
                'start_time': activity.start_time,
                'waitlist_count': activity.waitlist_count,
                'waitlist_items': waitlist_items,
            })
        
        abnormal_deposits = DepositAccount.objects.filter(
            is_abnormal=True
        ).select_related('member')
        
        abnormal_list = []
        for account in abnormal_deposits:
            abnormal_list.append({
                'id': account.id,
                'member_name': account.member.family_name,
                'balance': str(account.balance),
                'reason': account.abnormal_reason,
            })
        
        almost_full_activities = Activity.objects.filter(
            status=ActivityStatus.UPCOMING,
        ).select_related()
        
        almost_full_list = []
        for activity in almost_full_activities:
            if activity.is_almost_full():
                almost_full_list.append({
                    'id': activity.id,
                    'title': activity.title,
                    'start_time': activity.start_time,
                    'current_capacity': activity.current_capacity,
                    'max_capacity': activity.max_capacity,
                    'fill_rate': int(activity.current_capacity / activity.max_capacity * 100),
                })
        
        return Response({
            'today_returns': {
                'count': len(today_return_list),
                'items': today_return_list,
            },
            'pending_repairs': {
                'count': len(pending_repair_list),
                'items': pending_repair_list,
            },
            'waitlist_activities': {
                'count': len(waitlist_list),
                'items': waitlist_list,
            },
            'abnormal_deposits': {
                'count': len(abnormal_list),
                'items': abnormal_list,
            },
            'almost_full_activities': {
                'count': len(almost_full_list),
                'items': almost_full_list,
            },
        })
