import re
import logging
from django.conf import settings

logger = logging.getLogger(__name__)


def _safe_cache():
    try:
        from django.core.cache import cache
        cache.get('_ping')
        return cache
    except Exception:
        logger.warning('Cache backend unavailable, skipping cache operations')
        return None


def mask_phone(phone):
    if not phone:
        return ''
    cleaned = re.sub(r'\D', '', phone)
    if len(cleaned) >= 7:
        return cleaned[:3] + '****' + cleaned[-4:]
    return '****'


def get_store_ids_for_user(user):
    if user.is_superuser:
        return None
    from visit_dashboard.models import StorePermission
    return list(StorePermission.objects.filter(user=user).values_list('store_id', flat=True))


def filter_queryset_by_permission(queryset, user, store_field='store_id'):
    if user.is_superuser:
        return queryset
    store_ids = get_store_ids_for_user(user)
    if store_ids is not None and len(store_ids) > 0:
        return queryset.filter(**{f'{store_field}__in': store_ids})
    if store_ids is not None and len(store_ids) == 0:
        return queryset.none()
    return queryset


def get_completed_visits(queryset=None):
    from visit_dashboard.models import VisitRecord
    qs = queryset if queryset is not None else VisitRecord.objects.all()
    return qs.filter(visit_status=settings.VISIT_COMPLETE_STATUS)


def get_metric_config(dimension='store'):
    from visit_dashboard.models import MetricConfig
    cache_key = f'metric_config:{dimension}'
    c = _safe_cache()
    if c:
        try:
            config = c.get(cache_key)
            if config is not None:
                return config
        except Exception:
            pass
    config = MetricConfig.objects.filter(dimension=dimension, is_active=True).first()
    if config and c:
        try:
            c.set(cache_key, config, timeout=3600)
        except Exception:
            pass
    return config


def clear_metric_config_cache(dimension=None):
    c = _safe_cache()
    if not c:
        return
    try:
        if dimension:
            c.delete(f'metric_config:{dimension}')
        else:
            for dim in ['store', 'problem_type', 'team', 'handler']:
                c.delete(f'metric_config:{dim}')
    except Exception:
        pass


def compute_satisfaction_avg(visits):
    completed = [v for v in visits if v.is_completed and v.satisfaction_score is not None]
    if not completed:
        return None
    total = sum(v.satisfaction_score for v in completed)
    return round(total / len(completed), 2)


def get_low_score_visits(visits, threshold=None):
    if threshold is None:
        threshold = settings.LOW_SCORE_THRESHOLD
    return [v for v in visits if v.is_low_score and v.satisfaction_score <= threshold]


def get_post_refund_complaints(complaints):
    return [c for c in complaints if c.is_post_refund]


def build_annotation_marks(annotations):
    marks = []
    for ann in annotations:
        marks.append({
            'type': ann.anomaly_type,
            'text': ann.annotation_text,
            'annotated_by': str(ann.annotated_by) if ann.annotated_by else '系统',
            'created_at': ann.created_at.strftime('%Y-%m-%d %H:%M'),
        })
    return marks
