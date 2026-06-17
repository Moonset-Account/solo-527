from celery import shared_task
from datetime import datetime, timedelta
from django.db.models import Sum, Q
from django.utils import timezone

from .models import Budget, BudgetWarning, BudgetDashboard
from apps.materials.models import MaterialUsage, Material
from apps.users.models import User
from apps.notifications.models import Notification


@shared_task
def check_budget_warnings():
    budgets = Budget.objects.filter(is_current=True, status='approved')
    created_count = 0

    for budget in budgets:
        confirmed_changes = budget.changes.filter(status='confirmed').aggregate(total=Sum('amount'))['total'] or 0
        actual_usage = MaterialUsage.objects.filter(
            project=budget.project,
            status='approved'
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        total_actual = float(confirmed_changes) + float(actual_usage)
        threshold = float(budget.total_amount) * (1 + float(budget.warning_threshold) / 100)

        if total_actual > float(budget.total_amount):
            level = 'danger' if total_actual > threshold else 'warning'
            over_pct = ((total_actual - float(budget.total_amount)) / float(budget.total_amount)) * 100 if budget.total_amount > 0 else 0

            existing = BudgetWarning.objects.filter(
                budget=budget,
                is_resolved=False
            ).first()

            if not existing:
                warning = BudgetWarning.objects.create(
                    budget=budget,
                    level=level,
                    title=f'预算超支预警',
                    message=f'项目 {budget.project.name} 预算超支 {over_pct:.2f}%，预算金额: {budget.total_amount}，实际支出: {total_actual:.2f}',
                    current_value=total_actual,
                    threshold_value=float(budget.total_amount),
                )
                created_count += 1

                material_staff = list(User.objects.filter(role='material_staff', is_active=True))
                if budget.project.material_staff:
                    material_staff.append(budget.project.material_staff)
                if budget.project.project_manager:
                    material_staff.append(budget.project.project_manager)
                material_staff = list(set(material_staff))

                if material_staff:
                    notification = Notification.objects.create(
                        type='budget_warning',
                        level=level,
                        title=f'预算超支预警: {budget.project.name}',
                        message=f'项目 {budget.project.name} 的预算出现超支，请及时关注。预算金额: {budget.total_amount}，实际支出: {total_actual:.2f}',
                        related_type='budget',
                        related_id=budget.id,
                    )
                    notification.recipients.set(material_staff)

    return f'创建了 {created_count} 条预警'


@shared_task
def generate_monthly_report_task(year=None, month=None):
    from dateutil.relativedelta import relativedelta

    today = timezone.now().date()
    if year and month:
        report_date = datetime(year, month, 1).date()
    else:
        report_date = today.replace(day=1)

    from apps.projects.models import Project
    from apps.budgets.models import Budget

    projects = Project.objects.all()
    created = 0

    for project in projects:
        budget = Budget.objects.filter(project=project, is_current=True).first()
        actual_material = MaterialUsage.objects.filter(
            project=project,
            status='approved',
            created_at__year=report_date.year,
            created_at__month=report_date.month
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        from apps.repairs.models import Repair
        labor_total = Repair.objects.filter(
            project=project,
            status='completed',
            completed_at__year=report_date.year,
            completed_at__month=report_date.month
        ).aggregate(total=Sum('total_cost'))['total'] or 0

        changes_total = 0
        if budget:
            changes_total = budget.changes.filter(
                status='confirmed',
                created_at__year=report_date.year,
                created_at__month=report_date.month
            ).aggregate(total=Sum('amount'))['total'] or 0

        warning_count = 0
        if budget:
            warning_count = BudgetWarning.objects.filter(
                budget=budget,
                created_at__year=report_date.year,
                created_at__month=report_date.month
            ).count()

        dashboard, _ = BudgetDashboard.objects.update_or_create(
            project=project,
            snapshot_date=report_date,
            defaults={
                'budget': budget,
                'budget_amount': budget.total_amount if budget else 0,
                'actual_amount': float(actual_material) + float(labor_total),
                'change_amount': float(changes_total),
                'material_actual': float(actual_material),
                'labor_actual': float(labor_total),
                'warning_count': warning_count,
            }
        )
        created += 1

    return f'生成了 {created} 条月报快照'


@shared_task
def check_inspection_deadlines():
    from apps.inspections.models import Inspection
    from apps.notifications.models import Notification
    from apps.users.models import User

    today = timezone.now()
    deadline_passed = today - timedelta(days=1)

    pending = Inspection.objects.filter(
        rectification_required=True,
        result='fail',
        rectified_at__isnull=True,
        rectification_deadline__lte=today,
        rectification_deadline__gte=deadline_passed
    )

    for inspection in pending:
        recipients = []
        if inspection.inspector:
            recipients.append(inspection.inspector)
        if inspection.project.material_staff:
            recipients.append(inspection.project.material_staff)
        if inspection.project.project_manager:
            recipients.append(inspection.project.project_manager)
        if recipients:
            notification = Notification.objects.create(
                type='inspection_fail',
                level='danger',
                title='整改超期提醒',
                message=f'项目 {inspection.project.name} 的巡检整改已超期，请及时处理。巡检: {inspection.title}',
                related_type='inspection',
                related_id=inspection.id,
            )
            notification.recipients.set(list(set(recipients)))

    return f'检查了 {pending.count()} 条超期整改'


@shared_task
def check_low_material_stock():
    from apps.notifications.models import Notification
    from apps.users.models import User

    low_stock_materials = Material.objects.filter(stock_quantity__lte=10, is_active=True)

    if low_stock_materials.exists():
        material_staff = User.objects.filter(role='material_staff', is_active=True)
        if material_staff.exists():
            material_list = ', '.join([f'{m.name}({m.code})' for m in low_stock_materials[:5]])
            notification = Notification.objects.create(
                type='material_low',
                level='warning',
                title='库存不足提醒',
                message=f'以下材料库存不足: {material_list}',
                related_type='material',
            )
            notification.recipients.set(material_staff)

    return f'发现 {low_stock_materials.count()} 种材料库存不足'
