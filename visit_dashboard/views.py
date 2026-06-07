import json
from django.http import JsonResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils import timezone
from django.conf import settings
from django.db.models import Count, Avg, Q, F, Case, When, IntegerField, Sum
from django.db.models.functions import TruncDate

from visit_dashboard.models import (
    Store, Team, ProblemType, WorkOrder, VisitRecord,
    Refund, SecondaryComplaint, MetricConfig, AsyncReport, AnomalyAnnotation,
)
from visit_dashboard.utils import (
    mask_phone, filter_queryset_by_permission, get_completed_visits,
    get_metric_config, compute_satisfaction_avg, get_low_score_visits,
    get_post_refund_complaints, build_annotation_marks, clear_metric_config_cache,
)
from visit_dashboard.tasks import generate_custom_report


DIMENSION_FIELD_MAP = {
    'store': 'work_order__store__name',
    'problem_type': 'work_order__problem_type__name',
    'team': 'work_order__team__name',
    'handler': 'work_order__handler__last_name',
}

DIMENSION_WO_FIELD_MAP = {
    'store': 'store__name',
    'problem_type': 'problem_type__name',
    'team': 'team__name',
    'handler': 'handler__last_name',
}


@login_required
@ensure_csrf_cookie
def dashboard(request):
    stores = Store.objects.filter(is_active=True)
    problem_types = ProblemType.objects.all()
    teams = Team.objects.all()
    metric_configs = MetricConfig.objects.filter(is_active=True)

    context = {
        'stores': stores,
        'problem_types': problem_types,
        'teams': teams,
        'metric_configs': metric_configs,
        'low_score_threshold': settings.LOW_SCORE_THRESHOLD,
        'csrf_token': str(request.META.get('CSRF_COOKIE', '')),
    }
    return render(request, 'visit_dashboard/dashboard.html', context)


@login_required
@require_GET
def api_overview(request):
    user = request.user
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    store_id = request.GET.get('store_id')

    visits = get_completed_visits().select_related(
        'work_order', 'work_order__store', 'work_order__problem_type',
        'work_order__team', 'work_order__handler',
    ).prefetch_related('work_order__refunds', 'work_order__secondary_complaints')

    visits = _apply_filters(visits, date_from, date_to, store_id, user)

    work_order_ids = visits.values_list('work_order_id', flat=True)

    all_complaints = SecondaryComplaint.objects.filter(work_order_id__in=work_order_ids)
    post_refund_complaints = get_post_refund_complaints(all_complaints)
    low_score_visits = get_low_score_visits(visits)

    avg_satisfaction = compute_satisfaction_avg(visits)

    annotations = AnomalyAnnotation.objects.filter(
        related_work_order_id__in=work_order_ids,
    ).select_related('annotated_by')
    annotation_marks = build_annotation_marks(annotations)

    response_data = {
        'total_visits': visits.count(),
        'low_score_count': len(low_score_visits),
        'secondary_complaint_count': all_complaints.count(),
        'post_refund_complaint_count': len(post_refund_complaints),
        'avg_satisfaction': avg_satisfaction,
        'annotations': annotation_marks,
    }

    return JsonResponse(response_data)


@login_required
@require_GET
def api_low_score_detail(request):
    user = request.user
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    store_id = request.GET.get('store_id')

    visits = get_completed_visits().select_related(
        'work_order', 'work_order__store', 'work_order__problem_type',
        'work_order__team', 'work_order__handler',
    ).prefetch_related('work_order__refunds', 'work_order__secondary_complaints')

    visits = _apply_filters(visits, date_from, date_to, store_id, user)

    low_score_visits = get_low_score_visits(visits)

    low_score_list = []
    for v in low_score_visits:
        wo = v.work_order
        secondary = wo.secondary_complaints.first()
        is_post_refund_secondary = secondary and secondary.is_post_refund

        entry = {
            'order_no': wo.order_no,
            'customer_name': wo.customer_name,
            'customer_phone': mask_phone(wo.customer_phone),
            'store_name': wo.store.name if wo.store else '',
            'problem_type': wo.problem_type.name if wo.problem_type else '',
            'team_name': wo.team.name if wo.team else '',
            'handler_name': wo.handler.get_full_name() if wo.handler else '',
            'satisfaction_score': v.satisfaction_score,
            'recording_tags': v.recording_tags,
            'visited_at': v.visited_at.strftime('%Y-%m-%d %H:%M') if v.visited_at else '',
            'has_secondary_complaint': secondary is not None,
            'is_post_refund_complaint': is_post_refund_secondary,
        }
        low_score_list.append(entry)

    return JsonResponse({'low_score_visits': low_score_list})


@login_required
@require_GET
def api_secondary_complaint_detail(request):
    user = request.user
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    store_id = request.GET.get('store_id')

    complaints = SecondaryComplaint.objects.select_related(
        'work_order', 'work_order__store', 'work_order__problem_type',
        'work_order__team', 'work_order__handler',
    ).prefetch_related('work_order__refunds', 'work_order__visit_records')

    if not user.is_superuser:
        store_ids = filter_queryset_by_permission(
            WorkOrder.objects.all(), user
        ).values_list('store_id', flat=True)
        complaints = complaints.filter(work_order__store_id__in=store_ids)

    if store_id:
        complaints = complaints.filter(work_order__store_id=store_id)
    if date_from:
        complaints = complaints.filter(complaint_time__gte=date_from)
    if date_to:
        complaints = complaints.filter(complaint_time__lte=date_to)

    normal_complaints = []
    post_refund_complaints = []

    for c in complaints:
        wo = c.work_order
        visit = wo.visit_records.filter(visit_status='completed').first()

        entry = {
            'order_no': wo.order_no,
            'customer_name': wo.customer_name,
            'customer_phone': mask_phone(wo.customer_phone),
            'store_name': wo.store.name if wo.store else '',
            'problem_type': wo.problem_type.name if wo.problem_type else '',
            'team_name': wo.team.name if wo.team else '',
            'handler_name': wo.handler.get_full_name() if wo.handler else '',
            'complaint_type': c.complaint_type,
            'complaint_time': c.complaint_time.strftime('%Y-%m-%d %H:%M'),
            'is_post_refund': c.is_post_refund,
            'satisfaction_score': visit.satisfaction_score if visit else None,
        }

        if c.is_post_refund:
            post_refund_complaints.append(entry)
        else:
            normal_complaints.append(entry)

    return JsonResponse({
        'normal_complaints': normal_complaints,
        'post_refund_complaints': post_refund_complaints,
        'post_refund_count': len(post_refund_complaints),
    })


@login_required
@require_GET
def api_dimension_compare(request):
    user = request.user
    dimension = request.GET.get('dimension', 'store')
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    store_id = request.GET.get('store_id')

    get_metric_config(dimension)

    visits = get_completed_visits().select_related(
        'work_order', 'work_order__store', 'work_order__problem_type',
        'work_order__team', 'work_order__handler',
    ).prefetch_related('work_order__refunds', 'work_order__secondary_complaints')

    visits = _apply_filters(visits, date_from, date_to, store_id, user)

    dimension_field = DIMENSION_FIELD_MAP.get(dimension, 'work_order__store__name')

    threshold = settings.LOW_SCORE_THRESHOLD

    dimension_values = visits.annotate(
        dimension_key=F(dimension_field),
        is_low=Case(
            When(satisfaction_score__lte=threshold, then=1),
            default=0,
            output_field=IntegerField(),
        ),
    ).values('dimension_key').annotate(
        visit_count=Count('id'),
        avg_satisfaction=Avg('satisfaction_score'),
        low_score_count=Sum('is_low'),
    ).order_by('dimension_key')

    result = []
    for dv in dimension_values:
        if dv['dimension_key'] is None:
            continue
        result.append({
            'name': dv['dimension_key'],
            'visit_count': dv['visit_count'],
            'avg_satisfaction': round(dv['avg_satisfaction'], 2) if dv['avg_satisfaction'] else None,
            'low_score_count': dv['low_score_count'] or 0,
        })

    complaint_counts = {}
    work_order_ids = visits.values_list('work_order_id', flat=True)
    complaints = SecondaryComplaint.objects.filter(work_order_id__in=work_order_ids).select_related('work_order')
    for c in complaints:
        wo = c.work_order
        key = _get_dimension_value(wo, dimension)
        if key not in complaint_counts:
            complaint_counts[key] = {'normal': 0, 'post_refund': 0}
        if c.is_post_refund:
            complaint_counts[key]['post_refund'] += 1
        else:
            complaint_counts[key]['normal'] += 1

    for item in result:
        key = item['name']
        if key in complaint_counts:
            item['secondary_complaint_count'] = complaint_counts[key]['normal'] + complaint_counts[key]['post_refund']
            item['post_refund_complaint_count'] = complaint_counts[key]['post_refund']
        else:
            item['secondary_complaint_count'] = 0
            item['post_refund_complaint_count'] = 0

    annotations = AnomalyAnnotation.objects.filter(
        anomaly_type='post_refund_complaint',
        related_work_order_id__in=work_order_ids,
    )
    annotation_marks = build_annotation_marks(annotations)

    return JsonResponse({
        'dimension': dimension,
        'data': result,
        'annotations': annotation_marks,
    })


@login_required
@require_GET
def api_satisfaction_trend(request):
    user = request.user
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    store_id = request.GET.get('store_id')

    visits = get_completed_visits().select_related('work_order')

    visits = _apply_filters(visits, date_from, date_to, store_id, user)

    trend = visits.annotate(date=TruncDate('visited_at')).values('date').annotate(
        avg_score=Avg('satisfaction_score'),
        visit_count=Count('id'),
    ).order_by('date')

    work_order_ids = visits.values_list('work_order_id', flat=True)
    post_refund_dates = SecondaryComplaint.objects.filter(
        work_order_id__in=work_order_ids,
        is_post_refund=True,
    ).annotate(date=TruncDate('complaint_time')).values('date').annotate(
        count=Count('id'),
    ).order_by('date')

    trend_data = []
    for t in trend:
        trend_data.append({
            'date': t['date'].strftime('%Y-%m-%d') if t['date'] else '',
            'avg_satisfaction': round(t['avg_score'], 2) if t['avg_score'] else None,
            'visit_count': t['visit_count'],
        })

    post_refund_data = []
    for pr in post_refund_dates:
        post_refund_data.append({
            'date': pr['date'].strftime('%Y-%m-%d') if pr['date'] else '',
            'count': pr['count'],
        })

    annotations = AnomalyAnnotation.objects.filter(
        anomaly_type__in=['post_refund_complaint', 'low_score_trend'],
        related_work_order_id__in=work_order_ids,
    )
    annotation_marks = build_annotation_marks(annotations)

    return JsonResponse({
        'trend': trend_data,
        'post_refund_marks': post_refund_data,
        'annotations': annotation_marks,
    })


@login_required
@require_GET
def api_refund_status(request):
    user = request.user
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    store_id = request.GET.get('store_id')

    refunds = Refund.objects.select_related('work_order', 'work_order__store')

    if not user.is_superuser:
        store_ids_q = filter_queryset_by_permission(
            WorkOrder.objects.all(), user
        ).values_list('store_id', flat=True)
        refunds = refunds.filter(work_order__store_id__in=store_ids_q)

    if store_id:
        refunds = refunds.filter(work_order__store_id=store_id)
    if date_from:
        refunds = refunds.filter(created_at__gte=date_from)
    if date_to:
        refunds = refunds.filter(created_at__lte=date_to)

    status_counts = refunds.values('status').annotate(count=Count('id'))

    status_map = dict(Refund.REFUND_STATUS_CHOICES)
    result = []
    for sc in status_counts:
        result.append({
            'status': sc['status'],
            'status_display': status_map.get(sc['status'], sc['status']),
            'count': sc['count'],
        })

    return JsonResponse({'refund_status': result})


@login_required
@require_GET
def api_recording_tags(request):
    user = request.user
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    store_id = request.GET.get('store_id')

    visits = get_completed_visits().select_related('work_order')
    visits = _apply_filters(visits, date_from, date_to, store_id, user)

    tag_counts = {}
    for visit in visits:
        for tag in (visit.recording_tags or []):
            tag_counts[tag] = tag_counts.get(tag, 0) + 1

    sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)

    return JsonResponse({
        'recording_tags': [{'name': t[0], 'count': t[1]} for t in sorted_tags],
    })


@login_required
@require_POST
def api_create_report(request):
    user = request.user
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    report_type = body.get('report_type', 'custom')
    params = body.get('params', {})

    report = AsyncReport.objects.create(
        name=f'自定义报表-{timezone.now().strftime("%Y%m%d_%H%M")}',
        report_type=report_type,
        params=params,
        created_by=user,
    )

    try:
        task = generate_custom_report.delay(report.id, params)
        report.task_id = task.id
        report.save(update_fields=['task_id'])
        return JsonResponse({'report_id': report.id, 'task_id': task.id, 'status': 'pending'})
    except Exception as e:
        report.status = 'failed'
        report.error_message = f'Celery任务提交失败: {e}'
        report.save()
        return JsonResponse({'report_id': report.id, 'status': 'failed', 'error': str(e)})


@login_required
@require_GET
def api_report_status(request, report_id):
    try:
        report = AsyncReport.objects.get(id=report_id)
    except AsyncReport.DoesNotExist:
        return JsonResponse({'error': 'Report not found'}, status=404)

    return JsonResponse({
        'report_id': report.id,
        'status': report.status,
        'file_path': report.file_path if report.status == 'completed' else None,
        'error_message': report.error_message if report.status == 'failed' else None,
    })


@login_required
@require_GET
def api_metric_config_list(request):
    configs = MetricConfig.objects.filter(is_active=True)
    config_list = []
    for c in configs:
        config_list.append({
            'id': c.id,
            'name': c.name,
            'dimension': c.dimension,
            'dimension_display': c.get_dimension_display(),
            'low_score_threshold': c.low_score_threshold,
            'satisfaction_weight': c.satisfaction_weight,
            'include_unreachable': c.include_unreachable,
            'include_refused': c.include_refused,
        })
    return JsonResponse({'configs': config_list})


@login_required
@require_POST
def api_metric_config_create(request):
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    config = MetricConfig.objects.create(
        name=body.get('name', ''),
        dimension=body.get('dimension', 'store'),
        low_score_threshold=body.get('low_score_threshold', settings.LOW_SCORE_THRESHOLD),
        satisfaction_weight=body.get('satisfaction_weight', 1.0),
        include_unreachable=body.get('include_unreachable', False),
        include_refused=body.get('include_refused', False),
        created_by=request.user,
    )

    clear_metric_config_cache(config.dimension)

    return JsonResponse({
        'id': config.id,
        'name': config.name,
        'dimension': config.dimension,
        'message': '口径配置创建成功',
    })


@login_required
@require_POST
def api_annotation_create(request):
    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    work_order_id = body.get('work_order_id')
    anomaly_type = body.get('anomaly_type', 'post_refund_complaint')
    annotation_text = body.get('annotation_text', '')

    wo = None
    if work_order_id:
        try:
            wo = WorkOrder.objects.get(id=work_order_id)
        except WorkOrder.DoesNotExist:
            return JsonResponse({'error': 'Work order not found'}, status=404)

    annotation = AnomalyAnnotation.objects.create(
        related_work_order=wo,
        anomaly_type=anomaly_type,
        annotation_text=annotation_text,
        annotated_by=request.user,
    )

    return JsonResponse({
        'id': annotation.id,
        'anomaly_type': annotation.anomaly_type,
        'annotation_text': annotation.annotation_text,
        'message': '注释创建成功',
    })


def _apply_filters(visits, date_from, date_to, store_id, user):
    visits = filter_queryset_by_permission(visits, user)

    if date_from:
        visits = visits.filter(visited_at__gte=date_from)
    if date_to:
        visits = visits.filter(visited_at__lte=date_to)
    if store_id:
        visits = visits.filter(work_order__store_id=store_id)

    return visits


def _get_dimension_value(work_order, dimension):
    if dimension == 'store':
        return work_order.store.name if work_order.store else ''
    elif dimension == 'problem_type':
        return work_order.problem_type.name if work_order.problem_type else ''
    elif dimension == 'team':
        return work_order.team.name if work_order.team else ''
    elif dimension == 'handler':
        return work_order.handler.get_full_name() if work_order.handler else ''
    return ''
