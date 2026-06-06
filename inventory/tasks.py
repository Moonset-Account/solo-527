from celery import shared_task
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from .models import Batch, StockWarning, Supply


@shared_task
def check_expired_batches():
    today = timezone.now().date()
    warning_days = getattr(settings, 'WARNING_DAYS_BEFORE_EXPIRE', 30)
    warning_date = today + timedelta(days=warning_days)
    
    batches = Batch.objects.filter(is_expired=False)
    expired_count = 0
    warning_count = 0
    
    for batch in batches:
        if batch.expiry_date < today:
            batch.is_expired = True
            batch.save()
            expired_count += 1
            StockWarning.objects.create(
                supply=batch.supply,
                batch=batch,
                warning_type='EXPIRED',
                warning_level='DANGER',
                message=f'批号 {batch.batch_number} 已过期，请立即处理'
            )
        elif batch.expiry_date <= warning_date:
            warning_count += 1
            if not StockWarning.objects.filter(
                batch=batch,
                warning_type='EXPIRING',
                is_handled=False
            ).exists():
                StockWarning.objects.create(
                    supply=batch.supply,
                    batch=batch,
                    warning_type='EXPIRING',
                    warning_level='WARNING',
                    message=f'批号 {batch.batch_number} 将于 {batch.days_to_expire} 天后过期'
                )
    
    return f'检查完成：发现 {expired_count} 个已过期批号，{warning_count} 个即将过期批号'


@shared_task
def check_low_stock():
    threshold = getattr(settings, 'WARNING_STOCK_THRESHOLD', 10)
    supplies = Supply.objects.filter(is_active=True)
    warning_count = 0
    
    for supply in supplies:
        total = supply.total_stock
        if total <= supply.warning_threshold:
            warning_count += 1
            if not StockWarning.objects.filter(
                supply=supply,
                warning_type='LOW_STOCK',
                is_handled=False
            ).exists():
                StockWarning.objects.create(
                    supply=supply,
                    warning_type='LOW_STOCK',
                    warning_level='WARNING' if total > 0 else 'DANGER',
                    message=f'{supply.name} 库存不足，当前库存：{total}，预警阈值：{supply.warning_threshold}'
                )
    
    return f'库存预警检查完成：发现 {warning_count} 个库存不足的耗材'


@shared_task
def generate_high_value_audit_report(start_date, end_date):
    from surgery.models import HighValueAudit
    from django.db.models import Sum, Count
    
    audits = HighValueAudit.objects.filter(
        action_time__date__gte=start_date,
        action_time__date__lte=end_date
    )
    
    report = {
        'period': f'{start_date} 至 {end_date}',
        'total_records': audits.count(),
        'by_action_type': audits.values('action_type').annotate(
            count=Count('id'),
            total_quantity=Sum('quantity')
        ),
        'by_supply': audits.values('supply__name', 'supply__code').annotate(
            count=Count('id'),
            total_quantity=Sum('quantity')
        ),
        'unaudited_count': audits.filter(is_audited=False).count(),
    }
    
    return report
