from celery import shared_task
from datetime import date
from dashboard.models import Notification
from users.models import User, UserRole
from contracts.models import ContractRenewal
from django.db import models


@shared_task
def sync_contract_renewal_to_dashboard(renewal_id):
    try:
        renewal = ContractRenewal.objects.select_related(
            'original_contract', 'new_contract', 'handled_by'
        ).get(id=renewal_id)

        if renewal.decision in ['renewed', 'not_renewed']:
            recipients = User.objects.filter(
                models.Q(role=UserRole.PROCUREMENT_MANAGER) |
                models.Q(role=UserRole.PROJECT_MANAGER)
            ).distinct()

            if renewal.decision == 'renewed':
                title = f'合同续签完成: {renewal.original_contract.contract_number}'
                content = f'原合同【{renewal.original_contract.title}】已续签。新合同: {renewal.new_contract.contract_number if renewal.new_contract else "未关联"}'
            else:
                title = f'合同不续签: {renewal.original_contract.contract_number}'
                content = f'合同【{renewal.original_contract.title}】决定不续签。原因: {renewal.decision_reason}'

            notification = Notification.objects.create(
                notification_type='system',
                priority='medium',
                title=title,
                content=content,
                related_contract=renewal.original_contract,
                is_handled=True,
                handled_by=renewal.handled_by,
                handled_at=renewal.handled_date or date.today(),
                handle_result=renewal.decision_reason
            )
            notification.recipients.set(recipients)

        return f'Synced renewal {renewal_id}'
    except ContractRenewal.DoesNotExist:
        return f'Renewal {renewal_id} not found'


@shared_task
def send_daily_digest():
    from contracts.models import FrameworkContract
    from suppliers.models import SupplierRisk
    from invoices.models import Invoice
    from approvals.models import ApprovalRequest
    from datetime import date, timedelta

    today = date.today()
    thirty_days_later = today + timedelta(days=30)

    stats = {
        'expiring_contracts': FrameworkContract.objects.filter(
            status__in=['active', 'expiring_soon'],
            end_date__gte=today,
            end_date__lte=thirty_days_later
        ).count(),
        'pending_approvals': ApprovalRequest.objects.filter(
            status__in=['pending', 'in_progress']
        ).count(),
        'active_risks': SupplierRisk.objects.filter(
            status__in=['open', 'monitoring']
        ).count(),
        'pending_invoices': Invoice.objects.filter(
            status__in=['pending_review', 'reviewed', 'pending_payment']
        ).count(),
    }

    recipients = User.objects.filter(
        role__in=[UserRole.PROCUREMENT_MANAGER, UserRole.PROJECT_MANAGER, UserRole.ADMIN]
    ).distinct()

    notification = Notification.objects.create(
        notification_type='system',
        priority='medium',
        title=f'每日摘要 - {today.strftime("%Y-%m-%d")}',
        content=f'即将到期合同: {stats["expiring_contracts"]}个, 待审批: {stats["pending_approvals"]}个, 活跃风险: {stats["active_risks"]}个, 待处理发票: {stats["pending_invoices"]}个',
        is_handled=False
    )
    notification.recipients.set(recipients)

    return f'Daily digest sent to {recipients.count()} recipients'
