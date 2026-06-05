from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.conf import settings
from datetime import datetime
from .models import (
    Rehearsal, RoomMaintenance, Attendance,
    CancelRecord, PropUsage
)
from .tasks import (
    send_rehearsal_notification,
    send_change_notification,
    send_room_maintenance_notification,
)


@receiver(post_save, sender=Rehearsal)
def handle_rehearsal_save(sender, instance, created, **kwargs):
    if created:
        for member in instance.members.all():
            Attendance.objects.get_or_create(
                rehearsal=instance,
                member=member,
                defaults={'status': 'absent'}
            )
        if instance.status == 'approved':
            send_rehearsal_notification.delay(instance.id, 'info')
    else:
        pass


@receiver(pre_save, sender=Rehearsal)
def handle_rehearsal_update(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Rehearsal.objects.get(pk=instance.pk)
        except Rehearsal.DoesNotExist:
            return

        room_changed = old_instance.room_id != instance.room_id
        date_changed = old_instance.date != instance.date
        start_changed = old_instance.start_time != instance.start_time
        end_changed = old_instance.end_time != instance.end_time
        status_changed = old_instance.status != instance.status

        if (room_changed or date_changed or start_changed or end_changed) and instance.status in ['approved', 'ongoing']:
            send_change_notification.delay(
                instance.id,
                old_room_id=old_instance.room_id if room_changed else None,
                old_date=old_instance.date if date_changed else None,
                old_start=old_instance.start_time if start_changed else None,
                old_end=old_instance.end_time if end_changed else None,
            )

        if status_changed and instance.status == 'cancelled' and old_instance.status != 'cancelled':
            send_rehearsal_notification.delay(instance.id, 'cancel')
            PropUsage.objects.filter(rehearsal=instance).update(returned=True)

        if status_changed and instance.status == 'approved' and old_instance.status != 'approved':
            send_rehearsal_notification.delay(instance.id, 'info')


@receiver(post_save, sender=RoomMaintenance)
def handle_maintenance_save(sender, instance, created, **kwargs):
    if created and instance.status in ['scheduled', 'ongoing']:
        rehearsals = Rehearsal.objects.filter(
            room=instance.room,
            date__range=(instance.start_date, instance.end_date),
            status__in=['pending', 'approved', 'ongoing']
        )
        for rehearsal in rehearsals:
            rehearsal.status = 'cancelled'
            rehearsal.save()
            PropUsage.objects.filter(rehearsal=rehearsal).update(returned=True)
        instance.props_released = True
        instance.save(update_fields=['props_released'])
        send_room_maintenance_notification.delay(instance.id)


@receiver(post_save, sender=Attendance)
def handle_attendance_save(sender, instance, created, **kwargs):
    if instance.check_in_time and instance.status == 'present':
        rehearsal_start = datetime.combine(instance.rehearsal.date, instance.rehearsal.start_time)
        check_in = instance.check_in_time.replace(tzinfo=None)
        delta = check_in - rehearsal_start
        late_minutes = int(delta.total_seconds() / 60)
        if late_minutes > settings.LATE_THRESHOLD_MINUTES:
            instance.status = 'late'
            instance.late_minutes = late_minutes
            Attendance.objects.filter(pk=instance.pk).update(
                status='late',
                late_minutes=late_minutes
            )
