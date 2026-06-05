from celery import shared_task
from django.utils import timezone
from django.db import transaction, models
from .models import Reservation
from apps.books.models import Book
import logging

logger = logging.getLogger('apps')


@shared_task
def release_expired_reservations():
    now = timezone.now()
    expired_reservations = Reservation.objects.filter(
        status__in=[Reservation.STATUS_PENDING, Reservation.STATUS_CONFIRMED],
        expire_at__lte=now
    )
    
    count = 0
    for reservation in expired_reservations:
        try:
            with transaction.atomic():
                for item in reservation.items.all():
                    book = item.book
                    book.reserved_quantity = max(0, book.reserved_quantity - item.quantity)
                    book.save()
                
                reservation.status = Reservation.STATUS_EXPIRED
                reservation.save()
                count += 1
                logger.info(f'已释放过期预留单: {reservation.reservation_no}')
        except Exception as e:
            logger.error(f'释放预留单失败 {reservation.reservation_no}: {str(e)}')
    
    return f'已释放 {count} 个过期预留单'


@shared_task
def check_low_stock_notification():
    from apps.books.models import Book
    low_stock_books = Book.objects.filter(
        is_active=True,
        stock_quantity__lte=models.F('low_stock_threshold')
    )
    
    # 这里可以添加发送通知的逻辑
    logger.info(f'库存不足的图书数量: {low_stock_books.count()}')
    return low_stock_books.count()


@shared_task
def update_daily_sales_report(date=None):
    from django.utils import timezone
    from apps.sales.models import SaleOrder, DailySalesReport
    from datetime import date as date_obj, timedelta
    
    if date is None:
        date = (timezone.now() - timedelta(days=1)).date()
    elif isinstance(date, str):
        date = date_obj.fromisoformat(date)
    
    orders = SaleOrder.objects.filter(
        status__in=[SaleOrder.STATUS_PAID, SaleOrder.STATUS_COMPLETED],
        sale_date__date=date
    )
    
    report, created = DailySalesReport.objects.get_or_create(date=date)
    report.order_count = orders.count()
    report.member_count = orders.exclude(member__isnull=True).count()
    report.guest_count = orders.filter(member__isnull=True).count()
    report.total_quantity = sum(order.total_quantity for order in orders)
    report.total_amount = sum(order.total_amount for order in orders)
    report.total_points_earned = sum(order.points_earned for order in orders)
    report.total_points_used = sum(order.points_used for order in orders)
    report.discount_amount = sum(order.discount_amount for order in orders)
    report.save()
    
    return f'已更新 {date} 的销售报表'
