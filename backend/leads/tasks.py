from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from django.db.models import Q
from .models import Lead, TimeoutRecord
from common.models import PublicSeaRule
import logging

logger = logging.getLogger(__name__)


@shared_task
def check_followup_timeout():
    timeout_hours = getattr(settings, 'FOLLOWUP_TIMEOUT_HOURS', 24)
    threshold = timezone.now() - timedelta(hours=timeout_hours)

    leads = Lead.objects.filter(
        Q(next_followup_at__lt=threshold) | Q(last_followup_at__lt=threshold),
        is_timeout=False,
        is_public_sea=False,
        status__stage__in=['new', 'contacted', 'consulting', 'quoting', 'negotiating']
    ).exclude(assigned_to__isnull=True)

    for lead in leads:
        lead.is_timeout = True
        lead.save()
        TimeoutRecord.objects.create(
            lead=lead,
            timeout_type='followup',
            timeout_duration=timeout_hours,
            responsible_person=lead.assigned_to,
        )
        logger.info(f"Lead {lead.id} followup timeout")

    return f"Processed {leads.count()} timeout leads"


@shared_task
def check_lead_quality():
    leads = Lead.objects.filter(is_public_sea=False)
    for lead in leads:
        lead.calculate_quality_score()
        lead.save()
    return f"Updated {leads.count()} leads quality"


@shared_task
def check_public_sea():
    rule = PublicSeaRule.objects.filter(is_active=True).first()
    if not rule:
        return "No active public sea rule"

    threshold = timezone.now() - timedelta(days=rule.timeout_days)
    leads = Lead.objects.filter(
        last_followup_at__lt=threshold,
        is_public_sea=False,
        status__stage__in=['new', 'contacted', 'consulting']
    ).exclude(assigned_to__isnull=True)

    for lead in leads:
        lead.is_public_sea = True
        lead.assigned_to = None
        lead.save()
        logger.info(f"Lead {lead.id} moved to public sea")

    return f"Moved {leads.count()} leads to public sea"


@shared_task
def recalculate_all_lead_quality():
    leads = Lead.objects.all()
    count = 0
    for lead in leads:
        old_score = lead.quality_score
        lead.calculate_quality_score()
        if old_score != lead.quality_score:
            lead.save()
            count += 1
    return f"Recalculated quality for {count} leads"
