from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Project, ReviewComment, Resubmission, ReviewAssignment, MaterialVersion
from .tasks import (
    notify_project_submitted,
    notify_review_assigned,
    notify_comment_added,
    notify_resubmission_created,
    notify_project_archived,
)


@receiver(post_save, sender=Project)
def project_status_changed(sender, instance, created, **kwargs):
    if created:
        return
    old_status = getattr(instance, '_old_status', None)
    new_status = instance.status

    if old_status != new_status:
        if new_status == Project.Status.SUBMITTED:
            notify_project_submitted.delay(instance.id)
        elif new_status == Project.Status.ARCHIVED:
            if not instance.archived_at:
                instance.archived_at = timezone.now()
                Project.objects.filter(pk=instance.pk).update(archived_at=timezone.now())

            MaterialVersion.objects.filter(
                material__project=instance,
                is_archived=False
            ).update(is_archived=True)

            ReviewAssignment.objects.filter(
                project=instance,
                completed_at__isnull=True
            ).update(completed_at=timezone.now())

            notify_project_archived.delay(instance.id)


@receiver(post_save, sender=ReviewAssignment)
def review_assignment_created(sender, instance, created, **kwargs):
    if created:
        notify_review_assigned.delay(instance.id)


@receiver(post_save, sender=ReviewComment)
def review_comment_created(sender, instance, created, **kwargs):
    if created:
        notify_comment_added.delay(instance.id)


@receiver(post_save, sender=Resubmission)
def resubmission_created(sender, instance, created, **kwargs):
    if created:
        notify_resubmission_created.delay(instance.id)
