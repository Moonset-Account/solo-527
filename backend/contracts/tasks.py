from celery import shared_task
from datetime import date, timedelta
from django.db import models
from django.utils import timezone
from contracts.models import FrameworkContract, ContractRenewal
from users.models import User, UserRole
from dashboard.models import Notification


@shared_task
def check_contract_expiry():
    today = date.today()
    thirty_days_later = today + timedelta(days=30)
    sixty_days_later = today + timedelta(days=60)
    ninety_days_later = today + timedelta(days=90)
    contracts = FrameworkContract.objects.filter(
        status__in=['active', 'expiring_soon'],
        end_date__gte=today,
        end_date__lte=ninety_days_later
    ).select_related('project_manager', 'supplier')

    for contract in contracts:
        days_left = (contract.end_date - today).days
        if days_left <= 30:
            priority = 'high'
        elif days_left <= 60:
            priority = 'medium'
        else:
            priority = 'low'

        if days_left <= 30:
            contract.status = 'expiring_soon'
            contract.save()

        existing_notification = Notification.objects.filter(
            notification_type='contract_expiry',
            related_contract=contract,
            created_at__date=today
        ).exists()

        if not existing_notification:
            recipients = User.objects.filter(
                models.Q(role=UserRole.PROCUREMENT_MANAGER) |
                models.Q(role=UserRole.PROJECT_MANAGER) |
                models.Q(id=contract.project_manager_id)
            ).distinct()

            notification = Notification.objects.create(
                notification_type='contract_expiry',
                priority=priority,
                title=f'合同即将到期: {contract.contract_number}',
                content=f'合同【{contract.title}】将于{contract.end_date}到期，剩余{days_left}天。供应商: {contract.supplier.name}',
                related_contract=contract,
                is_handled=False
            )
            notification.recipients.set(recipients)

            ContractRenewal.objects.get_or_create(
                original_contract=contract,
                defaults={'decision': 'pending'}
            )

    return f'Checked {contracts.count()} contracts'


@shared_task
def sync_price_history_to_dashboard(specification_id=None):
    from contracts.models import PriceHistory
    from datetime import date
    qs = PriceHistory.objects.all()
    if specification_id:
        qs = qs.filter(specification_id=specification_id)
    return f'Synced {qs.count()} price history records'
