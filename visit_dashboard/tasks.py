import logging
import os
from celery import shared_task
from django.utils import timezone
from django.conf import settings
from django.db.models import Count

logger = logging.getLogger(__name__)


@shared_task
def clean_visit_data():
    from visit_dashboard.models import VisitRecord, WorkOrder, SecondaryComplaint, Refund

    logger.info('Starting visit data cleaning task...')

    orphan_visits = VisitRecord.objects.filter(work_order__isnull=True)
    orphan_count = orphan_visits.count()
    if orphan_count > 0:
        logger.warning(f'Found {orphan_count} orphan visit records, cleaning...')
        orphan_visits.delete()

    complaints = SecondaryComplaint.objects.filter(is_post_refund=False)
    updated = 0
    for complaint in complaints:
        if SecondaryComplaint.check_post_refund(complaint.work_order, complaint.complaint_time):
            complaint.is_post_refund = True
            complaint.save(update_fields=['is_post_refund'])
            updated += 1
    logger.info(f'Updated {updated} post-refund complaint flags')

    visits_no_score = VisitRecord.objects.filter(
        visit_status=settings.VISIT_COMPLETE_STATUS,
        satisfaction_score__isnull=True,
    )
    count_no_score = visits_no_score.count()
    if count_no_score > 0:
        logger.warning(f'Found {count_no_score} completed visits without satisfaction score')

    duplicate_visits = VisitRecord.objects.filter(
        visit_status=settings.VISIT_COMPLETE_STATUS,
        work_order__visit_records__visit_status=settings.VISIT_COMPLETE_STATUS,
    ).annotate(visit_count=Count('id')
    ).filter(visit_count__gt=1)

    logger.info('Visit data cleaning task completed')


@shared_task
def generate_daily_report():
    from visit_dashboard.models import AsyncReport, VisitRecord, WorkOrder, SecondaryComplaint, AnomalyAnnotation
    from visit_dashboard.utils import mask_phone, get_completed_visits
    import openpyxl

    logger.info('Starting daily report generation...')

    report = AsyncReport.objects.create(
        name=f'每日售后回访报表-{timezone.now().strftime("%Y%m%d")}',
        report_type='daily',
        status='pending',
    )
    report.task_id = generate_daily_report.request.id
    report.save(update_fields=['task_id'])

    try:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = '回访明细'

        headers = ['工单编号', '客户姓名', '客户手机号', '门店', '问题类型',
                   '处理班组', '处理人', '回访状态', '满意度评分', '录音标签',
                   '退款状态', '是否二次投诉', '是否退款后投诉', '异常注释']
        ws.append(headers)

        completed_visits = get_completed_visits().select_related(
            'work_order', 'work_order__store', 'work_order__problem_type',
            'work_order__team', 'work_order__handler', 'visitor',
        ).prefetch_related('work_order__refunds', 'work_order__secondary_complaints', 'work_order__annotations')

        for visit in completed_visits:
            wo = visit.work_order
            refund = wo.refunds.first()
            secondary = wo.secondary_complaints.first()
            annotations = wo.annotations.all()

            refund_status = refund.get_status_display() if refund else '无退款'
            has_secondary = '是' if secondary else '否'
            is_post_refund = '是' if (secondary and secondary.is_post_refund) else '否'
            annotation_texts = '; '.join([a.annotation_text for a in annotations]) if annotations else ''

            row = [
                wo.order_no,
                wo.customer_name,
                mask_phone(wo.customer_phone),
                wo.store.name if wo.store else '',
                wo.problem_type.name if wo.problem_type else '',
                wo.team.name if wo.team else '',
                wo.handler.get_full_name() if wo.handler else '',
                visit.get_visit_status_display(),
                visit.satisfaction_score if visit.satisfaction_score else '',
                ', '.join(visit.recording_tags) if visit.recording_tags else '',
                refund_status,
                has_secondary,
                is_post_refund,
                annotation_texts,
            ]
            ws.append(row)

        file_name = f'reports/daily_report_{timezone.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        file_path = os.path.join(settings.BASE_DIR, 'media', file_name)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        wb.save(file_path)

        report.file_path = file_path
        report.status = 'completed'
        report.completed_at = timezone.now()
        report.save()

        logger.info(f'Daily report generated: {file_path}')

    except Exception as e:
        logger.error(f'Daily report generation failed: {e}')
        report.status = 'failed'
        report.error_message = str(e)
        report.save()


@shared_task
def generate_custom_report(report_id, params):
    from visit_dashboard.models import AsyncReport, VisitRecord, AnomalyAnnotation
    from visit_dashboard.utils import mask_phone, get_completed_visits
    import openpyxl

    logger.info(f'Starting custom report generation for report_id={report_id}...')

    try:
        report = AsyncReport.objects.get(id=report_id)
    except AsyncReport.DoesNotExist:
        logger.error(f'Report {report_id} not found')
        return

    try:
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = '回访明细'

        headers = ['工单编号', '客户姓名', '客户手机号', '门店', '问题类型',
                   '处理班组', '处理人', '回访状态', '满意度评分', '录音标签',
                   '退款状态', '是否二次投诉', '是否退款后投诉', '异常注释']
        ws.append(headers)

        dimension = params.get('dimension', 'store')
        store_id = params.get('store_id')
        date_from = params.get('date_from')
        date_to = params.get('date_to')

        visits = get_completed_visits().select_related(
            'work_order', 'work_order__store', 'work_order__problem_type',
            'work_order__team', 'work_order__handler', 'visitor',
        ).prefetch_related('work_order__refunds', 'work_order__secondary_complaints', 'work_order__annotations')

        if store_id:
            visits = visits.filter(work_order__store_id=store_id)
        if date_from:
            visits = visits.filter(visited_at__gte=date_from)
        if date_to:
            visits = visits.filter(visited_at__lte=date_to)

        for visit in visits:
            wo = visit.work_order
            refund = wo.refunds.first()
            secondary = wo.secondary_complaints.first()
            annotations = wo.annotations.all()

            refund_status = refund.get_status_display() if refund else '无退款'
            has_secondary = '是' if secondary else '否'
            is_post_refund = '是' if (secondary and secondary.is_post_refund) else '否'
            annotation_texts = '; '.join([a.annotation_text for a in annotations]) if annotations else ''

            row = [
                wo.order_no,
                wo.customer_name,
                mask_phone(wo.customer_phone),
                wo.store.name if wo.store else '',
                wo.problem_type.name if wo.problem_type else '',
                wo.team.name if wo.team else '',
                wo.handler.get_full_name() if wo.handler else '',
                visit.get_visit_status_display(),
                visit.satisfaction_score if visit.satisfaction_score else '',
                ', '.join(visit.recording_tags) if visit.recording_tags else '',
                refund_status,
                has_secondary,
                is_post_refund,
                annotation_texts,
            ]
            ws.append(row)

        file_name = f'reports/custom_report_{report_id}_{timezone.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        file_path = os.path.join(settings.BASE_DIR, 'media', file_name)
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        wb.save(file_path)

        report.file_path = file_path
        report.status = 'completed'
        report.completed_at = timezone.now()
        report.save()

        logger.info(f'Custom report generated: {file_path}')

    except Exception as e:
        logger.error(f'Custom report generation failed: {e}')
        report.status = 'failed'
        report.error_message = str(e)
        report.save()


@shared_task
def detect_anomalies():
    from visit_dashboard.models import VisitRecord, SecondaryComplaint, AnomalyAnnotation, WorkOrder
    from django.db.models import Count, Avg

    logger.info('Starting anomaly detection...')

    recent_complaints = SecondaryComplaint.objects.filter(
        is_post_refund=True,
        annotations__isnull=True,
    ).select_related('work_order')

    for complaint in recent_complaints:
        AnomalyAnnotation.objects.create(
            related_work_order=complaint.work_order,
            anomaly_type='post_refund_complaint',
            annotation_text=f'二次投诉发生在退款后（退款时间早于投诉时间{complaint.complaint_time.strftime("%Y-%m-%d")}），需单独关注',
        )

    logger.info(f'Anomaly detection completed, processed {recent_complaints.count()} post-refund complaints')
