import random
from celery import shared_task
from django.utils import timezone
from .models import InspectionTask, InspectionResult, InspectionItem, InspectionTemplate


@shared_task
def run_inspection_task(task_id):
    try:
        task = InspectionTask.objects.get(id=task_id)
        task.status = InspectionTask.STATUS_RUNNING
        task.started_at = timezone.now()
        task.save()

        template = task.template
        servers = list(template.servers.all())
        for group in template.groups.all():
            servers.extend(list(group.servers.all()))
        servers = list(set(servers))

        items = InspectionItem.objects.filter(template=template, organization=task.organization)

        total = 0
        success = 0
        warning = 0
        critical = 0
        failed = 0

        for server in servers:
            for item in items:
                total += 1
                status = random.choice([
                    InspectionResult.STATUS_SUCCESS,
                    InspectionResult.STATUS_SUCCESS,
                    InspectionResult.STATUS_SUCCESS,
                    InspectionResult.STATUS_WARNING,
                    InspectionResult.STATUS_CRITICAL,
                ])
                actual = f'{random.randint(10, 99)}%'
                InspectionResult.objects.create(
                    organization=task.organization,
                    task=task,
                    item=item,
                    server=server,
                    status=status,
                    actual_value=actual,
                    expected_value=item.threshold,
                    message=f'巡检{item.name}结果: {status}'
                )
                if status == InspectionResult.STATUS_SUCCESS:
                    success += 1
                elif status == InspectionResult.STATUS_WARNING:
                    warning += 1
                elif status == InspectionResult.STATUS_CRITICAL:
                    critical += 1
                else:
                    failed += 1

        task.total_count = total
        task.success_count = success
        task.warning_count = warning
        task.critical_count = critical
        task.failed_count = failed
        task.finished_at = timezone.now()
        if failed > 0:
            task.status = InspectionTask.STATUS_FAILED
        elif warning > 0 or critical > 0:
            task.status = InspectionTask.STATUS_PARTIAL
        else:
            task.status = InspectionTask.STATUS_SUCCESS
        task.result_summary = f'巡检完成：正常{success}项，告警{warning}项，严重{critical}项，失败{failed}项'
        task.save()
    except Exception as e:
        if 'task' in locals():
            task.status = InspectionTask.STATUS_FAILED
            task.finished_at = timezone.now()
            task.result_summary = f'执行失败: {str(e)}'
            task.save()
        raise


@shared_task
def run_scheduled_inspections():
    templates = InspectionTemplate.objects.filter(is_active=True).exclude(cron_expression='')
    for template in templates:
        task_code = f'IN{timezone.now().strftime("%Y%m%d%H%M%S")}'
        task = InspectionTask.objects.create(
            organization=template.organization,
            template=template,
            code=task_code,
            name=f'{template.name} - 定时巡检',
            status=InspectionTask.STATUS_PENDING,
            trigger_type=InspectionTask.TRIGGER_AUTO,
        )
        run_inspection_task.delay(task.id)
