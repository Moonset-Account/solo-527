from celery import shared_task
from django.utils import timezone
from scheduling.services import NotificationService, ConflictDetectionService
from exhibitions.models import Exhibition, BorrowOrder


@shared_task
def check_overdue_borrows():
    NotificationService.notify_overdue_borrows()
    return 'Checked overdue borrows'


@shared_task
def check_upcoming_pickups():
    NotificationService.notify_upcoming_pickups(days=1)
    return 'Checked upcoming pickups'


@shared_task
def detect_all_conflicts():
    today = timezone.now().date()
    exhibitions = Exhibition.objects.filter(
        status__in=[Exhibition.PLANNING, Exhibition.INSTALLATION, Exhibition.OPEN],
        end_date__gte=today
    )

    conflicts_found = 0
    for exhibition in exhibitions:
        conflicts = ConflictDetectionService.detect_exhibition_conflicts(exhibition)
        conflicts_found += len(conflicts)

    borrow_orders = BorrowOrder.objects.filter(
        status__in=[BorrowOrder.DRAFT, BorrowOrder.PENDING_APPROVAL, BorrowOrder.APPROVED],
        expected_pickup_date__gte=today
    )

    for order in borrow_orders:
        conflicts = ConflictDetectionService.detect_material_conflicts(order)
        conflicts_found += len(conflicts)

    return f'Detected {conflicts_found} conflicts'


@shared_task
def daily_maintenance():
    check_overdue_borrows.delay()
    check_upcoming_pickups.delay()
    detect_all_conflicts.delay()
    return 'Daily maintenance completed'
